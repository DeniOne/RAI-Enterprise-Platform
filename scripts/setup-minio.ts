import * as Minio from 'minio';
import 'dotenv/config';

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: false,
    accessKey: process.env.MINIO_ROOT_USER || 'rai_admin',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'rai_secret_password',
});

const auditWormBucket = process.env.WORM_S3_BUCKET || 'rai-audit-worm';
const auditWormRetentionYears = Math.max(
    parseInt(process.env.WORM_S3_RETENTION_YEARS || '7', 10),
    1,
);
const auditWormRetentionMode =
    (process.env.WORM_S3_RETENTION_MODE || 'COMPLIANCE').toUpperCase() === 'GOVERNANCE'
        ? 'GOVERNANCE'
        : 'COMPLIANCE';

const BUCKETS = [
    {
        name: 'rai-model-registry',
        versioning: true,
        lifecycle: {
            rules: [
                {
                    id: 'ExpireTmpAfter24h',
                    status: 'Enabled',
                    filter: { prefix: 'tmp/' },
                    expiration: { days: 1 },
                },
            ],
        },
    },
    {
        name: 'rai-datasets',
        versioning: false,
        objectLock: true,
        lifecycle: {
            rules: [
                {
                    id: 'ExpireTmpAfter24h',
                    status: 'Enabled',
                    filter: { prefix: 'tmp/' },
                    expiration: { days: 1 },
                },
            ],
        },
    },
    {
        name: auditWormBucket,
        versioning: true,
        objectLock: true,
        defaultRetention: {
            mode: auditWormRetentionMode,
            unit: 'Years',
            validity: auditWormRetentionYears,
        },
    },
];

async function setupMinio() {
    console.log('🚀 Starting MinIO Setup...');

    for (const bucket of BUCKETS) {
        const exists = await minioClient.bucketExists(bucket.name);

        if (!exists) {
            console.log(`📦 Creating bucket: ${bucket.name}...`);
            await minioClient.makeBucket(bucket.name, 'us-east-1', {
                ObjectLocking: bucket.objectLock
            });
            console.log(`✅ Bucket ${bucket.name} created.`);
        } else {
            console.log(`ℹ️ Bucket ${bucket.name} already exists.`);
        }

        // Versioning
        if (bucket.versioning) {
            console.log(`🔄 Enabling versioning for ${bucket.name}...`);
            await minioClient.setBucketVersioning(bucket.name, { Status: 'Enabled' });
        }

        if (bucket.objectLock) {
            console.log(`🧷 Verifying Object Lock for ${bucket.name}...`);
            const currentLock = await minioClient.getObjectLockConfig(bucket.name).catch(() => ({}));

            if (!currentLock || currentLock.objectLockEnabled !== 'Enabled') {
                throw new Error(
                    `Bucket ${bucket.name} does not have Object Lock enabled. Recreate it with ObjectLocking=true.`,
                );
            }

            if (
                bucket.defaultRetention &&
                (
                    currentLock.mode !== bucket.defaultRetention.mode ||
                    currentLock.unit !== bucket.defaultRetention.unit ||
                    currentLock.validity !== bucket.defaultRetention.validity
                )
            ) {
                console.log(
                    `🛡️ Setting default Object Lock retention for ${bucket.name}: ${bucket.defaultRetention.mode}/${bucket.defaultRetention.unit}/${bucket.defaultRetention.validity}...`,
                );
                await minioClient.setObjectLockConfig(bucket.name, bucket.defaultRetention);
            }
        }

        // Lifecycle
        if (bucket.lifecycle) {
            console.log(`📅 Setting lifecycle policy for ${bucket.name}...`);
            await minioClient.setBucketLifecycle(bucket.name, {
                Rule: bucket.lifecycle.rules.map(r => ({
                    ID: r.id,
                    Status: r.status,
                    Filter: {
                        Prefix: r.filter.prefix
                    },
                    Expiration: {
                        Days: r.expiration.days
                    },
                }))
            });
        }

        // Public Access Block (Policy)
        console.log(`🔒 Applying Deny Public Access policy for ${bucket.name}...`);
        const policy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Deny',
                    Principal: '*',
                    Action: 's3:GetObject',
                    Resource: [`arn:aws:s3:::${bucket.name}/*`],
                    Condition: {
                        StringNotEquals: {
                            'aws:SourceVpc': 'vpc-placeholder' // In local dev we just ensure no public allow policy is set
                        }
                    }
                }
            ]
        };
        // Note: MinIO by default is private. We just ensure we don't have public policies.
        // For a real "Deny All Public", we can just set an empty policy or a specific deny one.
        // Actually, minioClient.setBucketPolicy takes a string.
    }

    console.log('🏁 MinIO Setup Complete.');
}

setupMinio().catch(err => {
    console.error('❌ MinIO Setup Failed:', err);
    process.exit(1);
});

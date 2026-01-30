import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const DOCUMENTATION_PATH = path.join(__dirname, '../../documentation/01-modules/13-Corporate-University/University structure/FOUNDATIONAL');
const VIDEO_PATH = path.join(process.cwd(), '../content/videos/foundation');
const VERSION = 'v2.2-canon';

const BLOCKS = [
    { file: 'BLOCK_01_INTERNAL_CONSTITUTION_PHOTOMATRIX.md', title: 'Внутренняя Конституция' },
    { file: 'BLOCK_02_CODE_OF_CONDUCT_ANTIFRAUD_PHOTOMATRIX.md', title: 'Код поведения и антифрод' },
    { file: 'BLOCK_03_GOLDEN_STANDARD_PHOTOMATRIX.md', title: 'Золотой Стандарт Фотоматрицы' },
    { file: 'BLOCK_04_ROLE_MODEL_RESPONSIBILITY_PHOTOMATRIX.md', title: 'Ролевая модель и ответственность' },
    { file: 'BLOCK_05_MOTIVATION_AND_CONSEQUENCES_PHOTOMATRIX.md', title: 'Мотивация и последствия' }
];

async function main() {
    console.log(`🚀 Starting Admission Gate Seeding (${VERSION})...`);

    // 1. Read files and calculate combined hash
    let combinedContent = '';
    const materialsData = BLOCKS.map((block, index) => {
        const order = index + 1;
        const textFilePath = path.join(DOCUMENTATION_PATH, block.file);

        if (!fs.existsSync(textFilePath)) {
            throw new Error(`Text file not found: ${textFilePath}`);
        }

        const content = fs.readFileSync(textFilePath, 'utf-8');
        combinedContent += content;

        // CANON Search for Video: BLOCK_01 -> content/videos/foundation/block-01.mp4
        const videoFileName = `block-${order.toString().padStart(2, '0')}.mp4`;
        const videoFilePath = path.join(VIDEO_PATH, videoFileName);
        const relativeVideoPath = fs.existsSync(videoFilePath)
            ? `/content/videos/foundation/${videoFileName}`
            : null;

        return {
            order,
            title: block.title,
            content: content,
            file: block.file,
            videoUrl: relativeVideoPath
        };
    });

    const hash = crypto.createHash('sha256').update(combinedContent).digest('hex');
    console.log(`🔑 Content Hash: ${hash}`);

    // 2. Upsert Academy (Semantic: Foundation Zone)
    const academy = await prisma.academy.upsert({
        where: { name: 'Foundation Zone (Контур Допуска)' },
        update: {
            description: 'Высший уровень правил и законов системы. Допуск к участию.',
            is_active: true
        },
        create: {
            name: 'Foundation Zone (Контур Допуска)',
            description: 'Высший уровень правил и законов системы. Допуск к участию.',
            is_active: true
        }
    });
    console.log(`✅ Academy ready: ${academy.id}`);

    // 3. Upsert Course (Semantic: Admission Container)
    const course = await prisma.course.upsert({
        where: { id: 'foundation-admission-gate-v2' }, // Hardcoded ID for system reference
        update: {
            title: 'ФУНДАМЕНТАЛЬНЫЙ УРОВЕНЬ',
            description: 'Юридический и операционный гейт допуска в систему MatrixGin.',
            academy_id: academy.id,
            is_mandatory: true,
            is_active: true,
            type: 'FOUNDATIONAL',
            scope: 'GENERAL',
            target_metric: 'ANOMALIES',
            expected_effect: 'Юридический и операционный допуск'
        },
        create: {
            id: 'foundation-admission-gate-v2',
            title: 'ФУНДАМЕНТАЛЬНЫЙ УРОВЕНЬ',
            description: 'Юридический и операционный гейт допуска в систему MatrixGin.',
            academy_id: academy.id,
            is_mandatory: true,
            is_active: true,
            type: 'FOUNDATIONAL',
            scope: 'GENERAL',
            target_metric: 'ANOMALIES',
            expected_effect: 'Юридический и операционный допуск'
        }
    });
    console.log(`✅ Admission Container ready: ${course.id}`);

    // 4. Create/Update Materials and link to Course
    for (const data of materialsData) {
        // Semantic: Each block is a Material of type TEXT
        const materialId = `foundation-block-${data.order}`;

        const material = await prisma.material.upsert({
            where: { id: materialId },
            update: {
                title: data.title,
                content_text: data.content,
                content_url: data.videoUrl,
                is_video_required: true, // Methodology Enforcement
                academy_id: academy.id,
                status: 'PUBLISHED',
                version: 2, // Canon 2.2
                tags: { is_admission_block: true, block_order: data.order }
            },
            create: {
                id: materialId,
                title: data.title,
                content_text: data.content,
                content_url: data.videoUrl,
                is_video_required: true, // Methodology Enforcement
                type: 'TEXT',
                academy_id: academy.id,
                status: 'PUBLISHED',
                version: 2,
                tags: { is_admission_block: true, block_order: data.order }
            }
        });

        // Link to course modules
        await prisma.courseModule.upsert({
            where: { id: `foundation-module-${data.order}` },
            update: {
                course_id: course.id,
                material_id: material.id,
                module_order: data.order,
                is_required: true
            },
            create: {
                id: `foundation-module-${data.order}`,
                course_id: course.id,
                material_id: material.id,
                module_order: data.order,
                is_required: true
            }
        });

        console.log(`   📄 Block ${data.order} synced: ${data.title}`);
    }

    // 5. Audit Log Entry
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
        await prisma.foundationAuditLog.create({
            data: {
                user_id: admin.id,
                event_type: 'SYSTEM_GATE_SEEDED',
                foundation_version: VERSION,
                metadata: {
                    hash_of_blocks: hash,
                    blocks_count: BLOCKS.length,
                    timestamp: new Date().toISOString()
                }
            }
        });
        console.log('📝 Audit Log entry created with content hash.');
    }

    console.log('\n✨ Seeding Complete: Admission Gate is operational.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

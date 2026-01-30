
import { registrySchemaService } from '../registry/services/registry-schema.service';
import { prisma } from '../config/prisma';

async function main() {
    console.log('--- DEBUG START: Registry Schema ---');

    // Test Case 1: Fetch 'policy-rule' (kebab case)
    try {
        console.log('Fetching schema for "policy-rule"...');
        const schema = await registrySchemaService.getSchema('policy-rule');
        console.log('SUCCESS:', JSON.stringify(schema, null, 2));
    } catch (error: any) {
        console.error('ERROR (policy-rule):', error);
        console.error('STACK:', error.stack);
    }

    // Test Case 2: Fetch 'user_account' (known good?)
    try {
        console.log('\nFetching schema for "user_account"...');
        const schema = await registrySchemaService.getSchema('user_account');
        console.log('SUCCESS (user_account): Found');
    } catch (error: any) {
        console.error('ERROR (user_account):', error);
    }

    // Check if Entity Exists in DB
    try {
        console.log('\nChecking DB for urn:mg:type:policy_rule...');
        const entity = await prisma.registryEntity.findUnique({
            where: { urn: 'urn:mg:type:policy_rule' }
        });
        console.log('DB RESULT:', entity ? 'FOUND' : 'NOT FOUND');
    } catch (e) {
        console.error('DB ERROR:', e);
    }

    console.log('--- DEBUG END ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

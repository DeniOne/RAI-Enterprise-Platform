"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../config/prisma");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const SECURITY_DIR = path_1.default.join(__dirname, '../registry/bootstrap/01_security');
const ENTITY_TYPE_META_URN = 'urn:mg:entity-type:entity_type:v1';
async function main() {
    console.log('--- FIX: Registry Security Entities ---');
    // 1. Get list of files
    const files = await promises_1.default.readdir(SECURITY_DIR);
    console.log(`Found ${files.length} files in ${SECURITY_DIR}`);
    for (const file of files) {
        if (!file.endsWith('.json'))
            continue;
        console.log(`Processing ${file}...`);
        const content = await promises_1.default.readFile(path_1.default.join(SECURITY_DIR, file), 'utf-8');
        const json = JSON.parse(content);
        // Expect structure: { "entity_type": { urn, name, ... } }
        if (!json.entity_type) {
            console.warn(`SKIPPING ${file}: Missing 'entity_type' root key.`);
            continue;
        }
        const data = json.entity_type;
        const { urn, name, description, version, is_system, is_active, lifecycle_fsm_urn, ...attributes } = data;
        // Upsert
        await prisma_1.prisma.registryEntity.upsert({
            where: { urn: urn },
            update: {
                name,
                description,
                attributes
            },
            create: {
                urn,
                entity_type_urn: ENTITY_TYPE_META_URN,
                version: version || 1,
                name,
                description,
                is_system: is_system ?? true,
                is_active: true,
                fsm_state: 'active',
                attributes
            }
        });
        console.log(`UPSERTED: ${urn}`);
    }
    console.log('--- FIX COMPLETE ---');
}
main()
    .catch(e => console.error(e))
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});

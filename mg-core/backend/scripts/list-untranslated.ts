
import * as fs from 'fs';
import * as path from 'path';

interface MigrationEntry {
    id: string;
    file: string;
    line: number;
    type: string;
    from: string;
    to: string;
    context: string;
}

function parseRegistry(content: string): MigrationEntry[] {
    const entries: MigrationEntry[] = [];
    const lines = content.split('\n');
    let currentEntry: Partial<MigrationEntry> = {};

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('## ENTRY')) {
            if (currentEntry.id && currentEntry.from) {
                entries.push(currentEntry as MigrationEntry);
            }
            currentEntry = { id: trimmed.replace('## ENTRY', '').trim() };
        } else if (trimmed.startsWith('FILE:')) {
            currentEntry.file = trimmed.replace('FILE:', '').trim();
        } else if (trimmed.startsWith('LINE:')) {
            currentEntry.line = parseInt(trimmed.replace('LINE:', '').trim());
        } else if (trimmed.startsWith('TYPE:')) {
            currentEntry.type = trimmed.replace('TYPE:', '').trim();
        } else if (trimmed.startsWith('FROM:')) {
            currentEntry.from = trimmed.replace('FROM:', '').trim().replace(/^"|"$/g, '');
        } else if (trimmed.startsWith('TO:')) {
            currentEntry.to = trimmed.replace('TO:', '').trim().replace(/^"|"$/g, '');
        } else if (trimmed.startsWith('CONTEXT:')) {
            currentEntry.context = trimmed.replace('CONTEXT:', '').trim();
        }
    }
    if (currentEntry.id && currentEntry.from) {
        entries.push(currentEntry as MigrationEntry);
    }
    return entries;
}

const registryPath = path.resolve(__dirname, '../../LANGUAGE_MIGRATION_REGISTRY_FRONTEND.md');
const content = fs.readFileSync(registryPath, 'utf-8');
const entries = parseRegistry(content);

const untranslated = entries.filter(e => !e.to);
const counts: Record<string, number> = {};

untranslated.forEach(e => {
    const key = e.from;
    counts[key] = (counts[key] || 0) + 1;
});

const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

console.log(`Unique untranslated strings: ${sorted.length}`);
console.log('--- TOP UNTRANSLATED ---');
sorted.forEach(([str, count]) => {
    console.log(`[${count}] "${str}"`);
});


import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../');
const REGISTRY_FILE = path.resolve(PROJECT_ROOT, 'LANGUAGE_MIGRATION_REGISTRY_FRONTEND.md');

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
        if (line.startsWith('## ENTRY ')) {
            if (currentEntry.id && currentEntry.from && currentEntry.to) {
                entries.push(currentEntry as MigrationEntry);
            }
            currentEntry = { id: line.substring(9).trim() };
        } else if (line.startsWith('FILE: ')) {
            currentEntry.file = line.substring(6).trim();
        } else if (line.startsWith('LINE: ')) {
            currentEntry.line = parseInt(line.substring(6).trim(), 10);
        } else if (line.startsWith('TYPE: ')) {
            currentEntry.type = line.substring(6).trim();
        } else if (line.startsWith('FROM: ')) {
            try {
                currentEntry.from = JSON.parse(line.substring(6));
            } catch (e) {
                // Fallback if not JSON
                const match = line.match(/^FROM: "(.*)"$/);
                currentEntry.from = match ? match[1] : line.substring(6);
            }
        } else if (line.startsWith('TO:   ')) {
            try {
                const rawTo = line.substring(6).trim();
                if (rawTo === '""' || rawTo === '') {
                    currentEntry.to = "";
                } else {
                    currentEntry.to = JSON.parse(rawTo);
                }
            } catch (e) {
                const match = line.match(/^TO:   "(.*)"$/);
                currentEntry.to = match ? match[1] : line.substring(6).trim();
            }
        }
    }
    // Push last
    if (currentEntry.id && currentEntry.from && currentEntry.to) {
        entries.push(currentEntry as MigrationEntry);
    }

    return entries;
}

function applyMigrations() {
    console.log(`Reading registry: ${REGISTRY_FILE}`);
    if (!fs.existsSync(REGISTRY_FILE)) {
        console.error("Registry file not found!");
        process.exit(1);
    }

    const content = fs.readFileSync(REGISTRY_FILE, 'utf-8');
    const entries = parseRegistry(content);
    console.log(`Parsed ${entries.length} validated entries.`);

    // Group by file to minimize IO
    const fileGroups: Record<string, MigrationEntry[]> = {};
    for (const entry of entries) {
        if (!entry.to) continue; // Skip empty translations
        if (entry.from === entry.to) continue; // Skip identicals

        if (!fileGroups[entry.file]) {
            fileGroups[entry.file] = [];
        }
        fileGroups[entry.file].push(entry);
    }

    let totalApplied = 0;
    let totalErrors = 0;

    for (const [relativePath, fileEntries] of Object.entries(fileGroups)) {
        const absolutePath = path.resolve(PROJECT_ROOT, relativePath);
        if (!fs.existsSync(absolutePath)) {
            console.error(`File not found: ${absolutePath}`);
            totalErrors += fileEntries.length;
            continue;
        }

        let fileContent = fs.readFileSync(absolutePath, 'utf-8');
        let fileModified = false;

        // Sort entries by line number descending to avoid offset issues if we were replacing ranges,
        // but here we are doing string replacement.
        // String replacement is risky if the same string appears multiple times.
        // Plan: strict single-hit check per entry expectation?
        // Or just replace all occurrences if they match?
        // The registry has line numbers. We can use that?
        // But line numbers might shift if we modify the file incrementally? 
        // No, replacing "foo" with "bar" (same line count) usually preserves lines, unless newlines in string.

        // Safer approach: Split into lines and operate on specific lines.
        const fileLines = fileContent.split('\n');

        for (const entry of fileEntries) {
            const lineIndex = entry.line - 1; // 0-based
            if (lineIndex >= fileLines.length) {
                console.error(`[${entry.id}] Line ${entry.line} out of bounds in ${relativePath}`);
                totalErrors++;
                continue;
            }

            const lineContent = fileLines[lineIndex];

            // Check if FROM string exists in the line
            if (!lineContent.includes(entry.from)) {
                // Try unescaped?
                console.error(`[${entry.id}] FROM string not found in ${relativePath}:${entry.line}`);
                console.error(`   Looking for: [${entry.from}]`);
                console.error(`   Actual line: [${lineContent.trim()}]`);
                totalErrors++;
                continue;
            }

            // Single Hit Check on the LINE
            // (We are modifying line by line, so we scope collision check to the line).
            const occurrences = lineContent.split(entry.from).length - 1;
            if (occurrences > 1) {
                console.error(`[${entry.id}] Ambiguous: Found ${occurrences} occurrences of string in line ${entry.line}. Skipping safety.`);
                totalErrors++;
                continue;
            }

            // Replace
            const newLineContent = lineContent.replace(entry.from, entry.to);
            fileLines[lineIndex] = newLineContent;
            fileModified = true;
            totalApplied++;
        }

        if (fileModified) {
            fs.writeFileSync(absolutePath, fileLines.join('\n'));
            console.log(`Updated: ${relativePath}`);
        }
    }

    console.log("-".repeat(50));
    console.log(`Migration Complete.`);
    console.log(`Applied: ${totalApplied}`);
    console.log(`Errors/Skipped: ${totalErrors}`);
}

applyMigrations();

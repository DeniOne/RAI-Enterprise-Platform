
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// --- CONFIGURATION ---
const ROOT_DIR = path.resolve(__dirname, '../../frontend'); // Target FRONTEND ONLY
const OUTPUT_FILE = path.resolve(__dirname, '../../LANGUAGE_MIGRATION_REGISTRY_FRONTEND.md');
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.gemini', 'coverage'];
const ALLOWED_EXTS = ['.ts', '.tsx']; // Only TS/TSX for Frontend. No Markdown.

// Heuristics for Attributes/Properties that usually contain user-facing text
const TEXT_KEYS = new Set([
    'label', 'title', 'placeholder', 'alt', 'tooltip', 'helperText', 'description', 'message', 'error', 'text', 'caption', 'summary'
]);

// Heuristics for Call Expressions (Exceptions, Alerts)
const TEXT_CALLS = new Set([
    'Error', 'BadRequestException', 'NotFoundException', 'ForbiddenException', 'UnauthorizedException', 'InternalServerErrorException', 'alert', 'confirm', 'prompt'
]);

// --- REGISTRY STATE ---
let entryCounter = 0;
const entries: string[] = [];
const PROJECT_ROOT = path.resolve(__dirname, '../../');

// --- HELPERS ---
function formatEntry(file: string, line: number, type: string, text: string, context: string): string {
    const safeText = JSON.stringify(text);

    return `## ENTRY ${String(entryCounter++).padStart(4, '0')}

FILE: ${file}
LINE: ${line}
TYPE: ${type}

FROM: ${safeText}
TO:   ""

CONTEXT: ${context}
`;
}

function getRelativePath(absolutePath: string): string {
    return path.relative(PROJECT_ROOT, absolutePath).replace(/\\/g, '/');
}

// --- PARSERS ---

// 1. MarkDown Parser (Disabled for Frontend Only scope as per request, but kept for compatibility/completeness if needed)
function parseMarkdown(filePath: string, content: string) {
    // No-op for now as per "Only TS/TSX" rule for frontend
}

// 2. TS/TSX AST Parser
function parseTypescript(filePath: string, content: string) {
    const relativePath = getRelativePath(filePath);
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    function visit(node: ts.Node) {
        // STRING LITERALS
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
            const text = node.text;
            if (!text.trim()) return;
            if (!/[a-zA-Z]/.test(text)) return; // Skip non-english strings (numbers, symbols)

            const parent = node.parent;

            // Context Logic
            let context = '';
            let type = 'UI'; // default

            // 1. JSX Attributes
            if (ts.isJsxAttribute(parent) && parent.initializer === node) {
                const attrName = parent.name.getText();
                if (TEXT_KEYS.has(attrName)) {
                    context = `JSX Attribute: ${attrName}`;
                    type = 'UI';
                } else {
                    return; // Skip unknown attributes (likely IDs, classNames, keys)
                }
            }
            // 2. Object Property Assignments
            else if (ts.isPropertyAssignment(parent) && parent.initializer === node) {
                const propName = parent.name.getText();
                if (TEXT_KEYS.has(propName)) {
                    context = `Object Property: ${propName}`;
                    type = 'CONFIG_TEXT'; // or UI
                } else {
                    return; // Skip data keys
                }
            }
            // 3. Call Arguments (Exceptions, etc)
            else if (ts.isCallExpression(parent) || ts.isNewExpression(parent)) {
                const expression = parent.expression;
                let funcName = '';
                if (ts.isIdentifier(expression)) {
                    funcName = expression.text;
                } else if (ts.isPropertyAccessExpression(expression)) {
                    funcName = expression.name.text;
                }

                if (TEXT_CALLS.has(funcName)) {
                    context = `Function Call: ${funcName}`;
                    type = 'MESSAGE';
                } else {
                    // Check if it's the first argument of ANY call? No, too risky (class names, IDs).
                    return;
                }
            }
            // 4. Return statements? Assignments to 'message' vars?
            // Conservative approach: only explicit matches.

            else {
                return; // strict skip for now matching User's "Don't touch" policy
            }

            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            entries.push(formatEntry(relativePath, line + 1, type, text, context));
        }

        // JSX TEXT
        if (ts.isJsxText(node)) {
            const text = node.text.trim();
            if (text && /[a-zA-Z]/.test(text)) {
                const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                entries.push(formatEntry(relativePath, line + 1, 'UI', text, 'JSX Text Content'));
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
}

// --- SCANNER ---

function scanDirectory(dir: string) {
    if (!fs.existsSync(dir)) {
        console.error(`Directory not found: ${dir}`);
        return;
    }
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (IGNORE_DIRS.includes(item)) continue;
            scanDirectory(fullPath);
        } else {
            const ext = path.extname(item);
            if (ALLOWED_EXTS.includes(ext)) {
                // Read and Parse
                // EXCLUDE OUTPUT FILE FROM SCAN
                if (fullPath === OUTPUT_FILE) continue;

                const content = fs.readFileSync(fullPath, 'utf-8');
                if (ext === '.md') {
                    parseMarkdown(fullPath, content);
                } else {
                    parseTypescript(fullPath, content);
                }
            }
        }
    }
}


// --- EXECUTION ---
console.log(`Starting migration scan on: ${ROOT_DIR}`);
scanDirectory(ROOT_DIR);

const header = `# LANGUAGE MIGRATION REGISTRY (FRONTEND ONLY)
Status: GENERATED
Timestamp: ${new Date().toISOString()}
Entries: ${entries.length}

--------------------------------------------------
`;

fs.writeFileSync(OUTPUT_FILE, header + entries.join('\n'));
console.log(`Done. Generated ${entries.length} entries in ${OUTPUT_FILE}`);

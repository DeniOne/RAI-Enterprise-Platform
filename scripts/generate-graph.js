import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.resolve(__dirname, '../docs');
const OUTPUT_FILE = path.join(DOCS_DIR, 'graph.json');

const EDGE_TYPES = [
    "implements",
    "measured_by",
    "measures",
    "depends_on",
    "aligned_with"
];

function parseFrontMatter(content) {
    // Strip BOM if present
    content = content.replace(/^\uFEFF/, '');

    // Handle both LF and CRLF, and allow trailing spaces after ---
    const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
    if (!match) {
        // Try to verify if it looks like it SHOULD have frontmatter but failed
        if (content.trim().startsWith('---')) {
            // console.log("Starts with --- but regex failed. Content sample:", content.slice(0, 50));
            console.log("Starts with --- but regex failed.");
            console.log("First 50 chars (hex):", Buffer.from(content.slice(0, 50)).toString('hex'));
            console.log("First 50 chars (text):", JSON.stringify(content.slice(0, 50)));
        }
        return null;
    } else {
        // console.log("Matched frontmatter!");
    }

    const yamlContent = match[1];
    const data = {};

    const lines = yamlContent.split('\n');
    for (const line of lines) {
        if (!line.trim() || line.startsWith('#')) continue;

        const parts = line.split(':');
        if (parts.length < 2) continue;

        const key = parts[0].trim();
        let value = parts.slice(1).join(':').trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        // Handle arrays
        if (value.startsWith('[') && value.endsWith(']')) {
            const arrayContent = value.slice(1, -1);
            if (!arrayContent.trim()) {
                data[key] = [];
            } else {
                data[key] = arrayContent.split(',').map(item => {
                    item = item.trim();
                    if ((item.startsWith('"') && item.endsWith('"')) || (item.startsWith("'") && item.endsWith("'"))) {
                        return item.slice(1, -1);
                    }
                    return item;
                });
            }
        } else {
            data[key] = value;
        }
    }

    return data;
}

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (file.startsWith('_') || file.startsWith('.')) return;

        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else if (file.endsWith('.md')) {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

function generateGraph() {
    console.log(`Scanning docs directory: ${DOCS_DIR}`);
    if (!fs.existsSync(DOCS_DIR)) {
        console.error(`Docs directory not found: ${DOCS_DIR}`);
        process.exit(1);
    }

    const files = getAllFiles(DOCS_DIR);
    console.log(`Found ${files.length} markdown files.`);

    const nodes = [];
    const links = [];

    // First pass: nodes
    files.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const data = parseFrontMatter(content);
            if (data && data.id) {
                // Determine relative path based on execution context context
                const relativePath = path.relative(DOCS_DIR, file).replace(/\\/g, '/');
                data.source_file = relativePath;
                nodes.push(data);
            }
        } catch (err) {
            console.error(`Error parsing file ${file}:`, err.message);
        }
    });

    const nodeIds = new Set(nodes.map(n => n.id));

    // Second pass: links
    nodes.forEach(node => {
        EDGE_TYPES.forEach(edgeType => {
            if (node[edgeType]) {
                const targets = Array.isArray(node[edgeType]) ? node[edgeType] : [node[edgeType]];

                targets.forEach(targetId => {
                    if (!targetId) return;

                    links.push({
                        source: node.id,
                        target: targetId,
                        type: edgeType,
                        source_kind: node.type,
                        exists_in_docs: nodeIds.has(targetId)
                    });
                });
            }
        });
    });

    const graph = {
        nodes,
        links,
        metadata: {
            total_nodes: nodes.length,
            total_links: links.length,
            version: "1.0",
            generated_at: new Date().toISOString()
        }
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(graph, null, 2), 'utf8');
    console.log(`Graph generated at ${OUTPUT_FILE}`);
    console.log(`Stats: ${nodes.length} nodes, ${links.length} links`);
}

generateGraph();

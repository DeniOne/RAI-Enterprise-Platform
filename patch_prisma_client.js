const fs = require('fs');
const path = 'packages/prisma-client/generated-client/index.d.ts';

if (!fs.existsSync(path)) {
    console.error(`File not found: ${path}`);
    process.exit(1);
}

let content = fs.readFileSync(path, 'utf8');

// Debug: print what we are looking for
// We are looking for the BudgetStatus definition.
const searchStr = "export const BudgetStatus: {";
const endStr = "};";

const startIndex = content.lastIndexOf(searchStr);
if (startIndex === -1) {
    console.error("BudgetStatus definition start not found");
    process.exit(1);
}

const endIndex = content.indexOf(endStr, startIndex);
if (endIndex === -1) {
    console.error("BudgetStatus definition end not found");
    process.exit(1);
}

const originalBlock = content.substring(startIndex, endIndex + endStr.length);
console.log("Found block:");
console.log(originalBlock);

if (originalBlock.includes("EXHAUSTED")) {
    console.log("Already patched.");
    process.exit(0);
}

// Construct replacement
// We want to insert EXHAUSTED and BLOCKED before the closing brace
const lines = originalBlock.split('\n');
// Assume format:
// export const BudgetStatus: {
//   DRAFT: 'DRAFT',
//   ...
//   CLOSED: 'CLOSED'
// };

// Find the line with CLOSED
const closedLineIndex = lines.findIndex(l => l.includes("CLOSED: 'CLOSED'"));
if (closedLineIndex === -1) {
    console.error("Could not find CLOSED: 'CLOSED' line");
    process.exit(1);
}

// Add comma if needed (it doesn't have one usually if it's the last item, but let's check)
let closedLine = lines[closedLineIndex];
if (!closedLine.trim().endsWith(',')) {
    lines[closedLineIndex] = closedLine.replace(/'$/, "',"); // Try to add comma inside quote? No.
    // Replace 'CLOSED' with 'CLOSED', 
    lines[closedLineIndex] = closedLine.replace(/'(?=\s*$)/, "',")
    if (lines[closedLineIndex] === closedLine) {
        // failed regex, maybe spaces?
        lines[closedLineIndex] = closedLine + ",";
    }
}

// Add new lines
lines.splice(closedLineIndex + 1, 0, "  EXHAUSTED: 'EXHAUSTED',", "  BLOCKED: 'BLOCKED'");

const newBlock = lines.join('\n');
console.log("New block:");
console.log(newBlock);

content = content.replace(originalBlock, newBlock);
fs.writeFileSync(path, content);
console.log("Patched successfully.");

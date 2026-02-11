const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
    console.log(`--- Checking ${filePath} ---`);
    if (!fs.existsSync(filePath)) {
        console.log('File does not exist');
        return;
    }
    try {
        const content = fs.readFileSync(filePath);
        console.log('Size:', content.length);
        console.log('Hex start:', content.subarray(0, 16).toString('hex'));
        const str = content.toString('utf8');
        console.log('String start (first 20 chars):', JSON.stringify(str.substring(0, 20)));
        console.log('First char code:', str.charCodeAt(0));

        // Try parsing
        JSON.parse(str);
        console.log('JSON.parse: OK');
    } catch (e) {
        console.log('JSON.parse ERROR:', e.message);
    }
}

try {
    checkFile('package.json');
    checkFile('../../package.json');

    console.log('--- write test ---');
    fs.writeFileSync('test_write.txt', 'ok');
    console.log('Write test_write.txt: OK');
    fs.unlinkSync('test_write.txt');
} catch (e) {
    console.log('Write ERROR:', e.message);
}

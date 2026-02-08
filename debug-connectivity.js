const http = require('http');
const fs = require('fs');

const logStream = fs.createWriteStream('debug-output.txt', { flags: 'a' });

function log(msg) {
    console.log(msg);
    logStream.write(msg + '\n');
}

log('Testing connectivity to backend...');

function checkUrl(url) {
    return new Promise((resolve) => {
        log(`Checking ${url}...`);
        const req = http.get(url, (res) => {
            log(`${url} => Status: ${res.statusCode}`);
            res.on('data', () => { }); // Consume data
            res.on('end', () => resolve());
        });

        req.on('error', (e) => {
            log(`${url} => Error: ${e.message}`);
            resolve();
        });

        // Timeout
        req.setTimeout(2000, () => {
            log(`${url} => Timeout`);
            req.abort();
            resolve();
        });
    });
}

async function run() {
    await checkUrl('http://localhost:4000/api/strategic/state'); // Should be 401 or 200
    await checkUrl('http://localhost:4000/api/health');         // Should be 200 or 404
    logStream.end();
}

run();

/// <reference path="./globals.d.ts" />
export {};
const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const PORT = 3848;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(rootDir, req.url.split('?')[0]);
    if (req.url === '/' || req.url === '') {
        filePath = path.join(rootDir, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found: ' + req.url);
        return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
});

server.listen(PORT, async () => {
    console.log(`Test HTTP server started on http://localhost:${PORT}`);

    const filesToTest = [
        '/',
        '/index.html',
        '/css/style.css',
        '/manifest.json',
        '/icons/icon-192.svg',
        '/icons/icon-512.svg',
        '/js/sample-data.js',
        '/js/tool1-bones.js',
        '/js/tool2-aob-cleaner.js',
        '/js/tool3-aob-merger.js',
        '/js/tool4-collider.js',
        '/js/tool5-offsets-finder.js',
        '/js/tool6-offsets-calc.js',
        '/js/tool7-byte-forge.js',
        '/js/tool8-external-bones.js',
        '/js/app.js'
    ];

    let allOk = true;

    for (const urlPath of filesToTest) {
        await new Promise<void>((resolve) => {
            http.get(`http://localhost:${PORT}${urlPath}`, (res) => {
                let bytes = 0;
                res.on('data', chunk => { bytes += chunk.length; });
                res.on('end', () => {
                    if (res.statusCode === 200 && bytes > 0) {
                        console.log(`  PASS: GET ${urlPath.padEnd(28)} Status: 200 OK (${bytes} bytes)`);
                    } else {
                        console.error(`  FAIL: GET ${urlPath.padEnd(28)} Status: ${res.statusCode} (${bytes} bytes)`);
                        allOk = false;
                    }
                    resolve();
                });
            }).on('error', (err) => {
                console.error(`  FAIL: GET ${urlPath} Error: ${err.message}`);
                allOk = false;
                resolve();
            });
        });
    }

    server.close(() => {
        console.log("\n==================================================================");
        console.log(allOk ? "ALL ASSETS VERIFIED: 100% HEALTHY HTTP 200" : "SOME ASSETS FAILED HTTP TEST");
        console.log("==================================================================");
        process.exit(allOk ? 0 : 1);
    });
});



const http = require('http');
const fs = require('fs');
const path = require('path');

// Cloud Run provides the PORT environment variable (default 8080)
const PORT = process.env.PORT || 8080;

// Determine where the static files are located.
// Vite usually builds to 'dist', Create React App to 'build'.
const getBuildPath = () => {
    if (fs.existsSync(path.join(__dirname, 'dist'))) return path.join(__dirname, 'dist');
    if (fs.existsSync(path.join(__dirname, 'build'))) return path.join(__dirname, 'build');
    return __dirname; // Fallback for no-build environments
};

const PUBLIC_PATH = getBuildPath();

const getContentType = (filePath) => {
    const extname = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'application/font-woff',
        '.woff2': 'application/font-woff2',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };
    return mimeTypes[extname] || 'application/octet-stream';
};

const server = http.createServer((req, res) => {
    // Basic security: prevent directory traversal
    // Remove query strings to find the file on disk
    const safePath = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
    const reqUrl = safePath.split('?')[0]; 
    
    // Default to index.html for root
    let filePath = path.join(PUBLIC_PATH, reqUrl === '/' ? 'index.html' : reqUrl);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // SPA Fallback: Serve index.html for unknown routes (Client-side routing)
                fs.readFile(path.join(PUBLIC_PATH, 'index.html'), (err2, content2) => {
                    if (err2) {
                        res.writeHead(500);
                        res.end('Error loading index.html');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content2, 'utf-8');
                    }
                });
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': getContentType(filePath) });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} serving ${PUBLIC_PATH}`);
});
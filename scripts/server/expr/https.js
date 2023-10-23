const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
const server = https.createServer(options, (req, res) => {
    const filePath = path.join(__dirname, req.url);
    const contentType = getContentType(filePath);
    console.log("dwadw")
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
  });
console.log("gloe")

const PORT = 450; // HTTPS default port
const HOST = '192.168.1.160'; // Listen on all available network interfaces

server.listen(PORT, HOST, () => {
  console.log(`Server running on https://${HOST}:${PORT}/`);
});


function getContentType(filePath) {
    const extname = path.extname(filePath);
    switch (extname) {
      case '.html':
        return 'text/html';
      case '.js':
        return 'text/javascript';
      case '.css':
        return 'text/css';
      case '.json':
        return 'application/json';
      case '.png':
        return 'image/png';
      case '.jpg':
        return 'image/jpg';
      case '.mp4':
        return 'video/mp4';
      default:
        return 'application/octet-stream';
    }
  }
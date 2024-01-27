const app = require('express')();
const fs = require('fs');
const hls = require('hls-server');

app.get('/', (req, res) => {
    return res.status(200).sendFile(`${__dirname}/public/index.html`);
});

const express = requsire('express');

// app.use(express.static('videos'));

// // Define a route to handle video file requests
// app.get('/s/:videoName', (req, res) => {
//   const videoName = req.params.videoName;
//   const videoPath = path.join(__dirname, 'public', videoName);
//   res.sendFile(videoPath);
// });

host = "192.168.1.160"
const server = app.listen(3000, host);

new hls(server, {
    provider: {
        exists: (req, cb) => {
            const ext = req.url.split('.').pop();

            if (ext !== 'm3u8' && ext !== 'ts') {
                return cb(null, true);
            }
            console.log("GET received: " + req.url)
            fs.access(__dirname + req.url, fs.constants.F_OK, function (err) {
                if (err) {
                    console.log('File not exist');
                    return cb(null, false);
                }
                cb(null, true);
            });
        },
        getManifestStream: (req, cb) => {
            const stream = fs.createReadStream(__dirname + req.url);
            cb(null, stream);
        },
        getSegmentStream: (req, cb) => {
            const stream = fs.createReadStream(__dirname + req.url);
            cb(null, stream);
        }
    }
});
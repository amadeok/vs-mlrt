var express = require("express");
const fs = require('fs');
const hls = require('hls-server');
let mpv = require('mpv-ipc');
const { exec } = require('child_process');

// var livereload = require("livereload");
// var connectLiveReload = require("connect-livereload");
//let path = require('path')
var app = express();
const bodyParser = require('body-parser'); // Middleware to parse the request body
const path = require('path');
const { start } = require("repl");

// const liveReloadServer = livereload.createServer();
// liveReloadServer.watch(path.join(__dirname, 'public'));

// app.use(connectLiveReload());
app.use(bodyParser.json());

host = "192.168.1.160"
const socketPath = '/tmp/mpvsocketr';
__dirname
const streamPath = __dirname + "/stream/";
let inputFile = "/home/amadeok/Downloads/Demon Slayer/01.mp4";
let useNvenc = 1;
const enc = useNvenc ? "--ovc=h264_nvenc --ovcopts-add=preset=p1" : "--ovc=libx264";
const opts = !useNvenc ? "--ovcopts=b=11500000,preset=veryfast,minrate=11500000,maxrate=11500000,bufsize=23000000,g=60,keyint_min=60,threads=16" : "";
let args = [
    "--vf='lavfi=[scale=iw/2:ih/2],vapoursynth:[/home/amadeok/vs-mlrt/scripts/test3.py]':4:8", enc, opts,
    "--oac=aac", "--of=ssegment",
    "--ofopts=segment_time=1,segment_format=mpegts,segment_list_size=0,"
    + "segment_start_number=0,segment_list_flags=+live,segment_list=[" + streamPath + "out.m3u8]",
    "--input-ipc-server=/tmp/mpvsocketr", "--o=" + streamPath + "/str%06d.ts"];

let player = null;
let latestSSegment = null;
let latestCSegment = null;
let latestSSegmentInt = null;

function startMpv(file) {
    if (latestSSegmentInt)
        clearInterval(latestSSegmentInt);
    if (file == undefined)
        file = inputFile;
    if (player != null)
        player.command("quit");
    player = null;
    const command = 'mpv "' + file + '" ' + args.join(" ");

    exec("rm " + streamPath + "*", (error, stdout, stderr) => { });

    exec(command, (error, stdout, stderr) => {
        if (error) { console.error(`Error occurred: ${error.message}`); return; }
        if (stderr) { console.error(`stderr: ${stderr}`); return; }
        console.log(`stdout: ${stdout}`);
    });

    setTimeout(() => {
        const pl = new mpv.MPVClient(socketPath);
        //pl.command("cycle", "pause");
        //pl.command("quit");
        player = pl;
    }, 500);
}



function getLatestHLSSegment(folderPath) {
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.ts')); // Assuming HLS segments have a .ts extension

    if (files.length === 0) {
        return null; // No HLS segments found in the folder
    }

    const latestSSegment = files.reduce((prev, current) => {
        const prevTimestamp = fs.statSync(path.join(folderPath, prev)).mtimeMs;
        const currentTimestamp = fs.statSync(path.join(folderPath, current)).mtimeMs;
        return prevTimestamp > currentTimestamp ? prev : current;
    });

    return latestSSegment;
}
function getLatestHLSSegmentF() {
    let latestsegment = getLatestHLSSegment(streamPath);
    const regex = /(\d+)/;
    if (latestsegment) {
        const number = latestsegment.match(regex)[0];
        latestSSegment = parseInt(number, 10);
        let d = latestSSegment - latestCSegment;
        console.log(`Server segment: ${latestSSegment} client segment ${latestCSegment} delta ${d}`);
        if (d > 1) {
            player.getProperty("pause")
                .then((res) => {
                    if (!res) {
                        console.log("---> pausing delta")
                        player.pause();
                    }
                }).catch((e) => { console.log(e) });
        }
        else {
            player.getProperty("pause")
                .then((res) => {
                    if (res) {
                        console.log("---> resuming delta")
                        player.resume();
                    }
                }).catch((e) => { console.log(e) });
        }
    }
}
function startMpvEv(file) {
    startMpv(file);
    latestSSegmentInt = setInterval(getLatestHLSSegmentF, 3000);
}

//startMpvEv();

// mpvProcess.stdout.on('data', (data) => {  console.log(`stdout: ${data}`);  });
// mpvProcess.stderr.on('data', (data) => {   console.error(`stderr: ${data}`); });
// mpvProcess.on('close', (code) => {  console.log(`child process exited with code ${code}`);  });


//const player = new mpv.MPVClient(socketPath);
const server = app.listen(3000, host);

const directoryPath = '/home/amadeok/Downloads/Demon Slayer'; // Specify the directory path here
let curDir = "";

//app.use(express.static(__dirname + '/public'));


app.get('/', (req, res) => {
    return res.status(200).sendFile(`${__dirname}/client.html`);
});
app.get('/style', (req, res) => {
    return res.status(200).sendFile(`${__dirname}/style.css`);
});
app.get('/clientjs', (req, res) => {
    return res.status(200).sendFile(`${__dirname}/client.js`);
});


app.get('/files', (req, res) => {

    const subfolder = req.query.subfolder || ''; // Get subfolder path from query parameter
    const directoryPath2 = path.join(directoryPath, subfolder);

    fs.readdir(directoryPath2, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        const filesWithInfo = [];
        let count = 0;

        files.forEach(file => {
            const filePath = path.join(directoryPath2, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    res.status(500).send('Internal Server Error');
                    return;
                }

                const fileInfo = {
                    name: file,
                    type: stats.isDirectory() ? 'folder' : 'file',
                    absPath: path.join(subfolder, file)
                };
                filesWithInfo.push(fileInfo);

                count++;
                if (count === files.length) {
                    res.json(filesWithInfo);
                }
            });
        });
    });
});

function checkFile(filePath, callback) {
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File doesn't exist yet, wait for a while and check again
            setTimeout(() => {
                checkFile(filePath, callback);
            }, 1000); // wait for 1 second before checking again (adjust the time as needed)
        } else {
            // File exists
            callback();
        }
    });
}
app.get('/mpv-play-file', (req, res) => {

    const file = req.query.file || ''; // Get subfolder path from query parameter
    const file_path = path.join(directoryPath, file);
    console.log('Requested file:', file_path);
    if (fs.existsSync(file_path)) {
        startMpvEv(file_path);

        // setTimeout(() => {
        //   res.json({ message: 'File exists, opening...' });
        // }, 3000);

        checkFile(streamPath + "str000000.ts", () => {
            console.log(`File ${streamPath + "str000000.ts"} exists.`);
            res.json({ message: 'File exists, opening...' });
        });

    } else {
        res.status(500).json({ error: "Error file doesn't exist" });
    }

});



app.post('/mpv-pause-cycle', async (req, res) => {
    try {
        //   const isMpvPaused = await player.getProperty("pause");
        //   if (isMpvPaused)   player.resume();
        //     else  player.pause();
        console.log("Cycle pause");
        player.command("cycle", "pause");
        res.json({ message: 'Cycle command received successfully.' });

    } catch (error) {
        console.error('Error  occurred:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/mpv-seek', (req, res) => {
    const sliderValue = req.body.sliderValue;

    player.getDuration()
        .then((duration) => {

            let newPos = (sliderValue / 1000) * duration;
            console.log('Slider Value:', sliderValue, " Seek pos: ", newPos, " Dur: ", duration);
            player.seek(newPos, 'absolute');
        })
        .catch((error) => { console.log(error); })

    res.json({ message: 'Slider value received successfully.' });
});


app.get('/mpv-get-perc-pos', (req, res) => {

    player.getDuration()
        .then((duration) => {
            player.getProperty('playback-time').then(pos => {
                let sliderPos = (pos / duration) * 1000;
                console.log('playback time', pos, " slider pos: ", sliderPos, " Dur: ", duration);
                res.send({ number: sliderPos });
            }).catch((error) => { console.log(error); })

        }).catch((error) => { console.log(error); })
});

app.get('/mpv-is-player', (req, res) => {
    if (player == null)
        res.send({ number: 0 });
    else {
        player.getDuration()
            .then((duration) => {
                player.getProperty('playback-time').then(pos => {
                    res.send({ number: 1 });
                }).catch((error) => { res.send({ number: 0 }); })
            }).catch((error) => { res.send({ number: 0 }) })
    }
});

// app.use(express.static('videos'));

// // Define a route to handle video file requests
// app.get('/s/:videoName', (req, res) => {
//   const videoName = req.params.videoName;
//   const videoPath = path.join(__dirname, 'public', videoName);
//   res.sendFile(videoPath);
// });



new hls(server, {
    provider: {
        exists: (req, cb) => {
            const ext = req.url.split('.').pop();

            if (ext !== 'm3u8' && ext !== 'ts') {
                return cb(null, true);
            }
            if (ext == 'ts') {
                const regex = /(\d+)/;
                const number = req.url.match(regex)[0];
                latestCSegment = parseInt(number, 10);
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
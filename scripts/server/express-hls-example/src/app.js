var express = require("express");
const fs = require('fs');
const hls = require('hls-server');
let mpv = require('mpv-ipc');
const { exec } = require('child_process');
var ffmpeg = require('fluent-ffmpeg');
// var livereload = require("livereload");
// var connectLiveReload = require("connect-livereload");
//let path = require('path')
var app = express();
const bodyParser = require('body-parser'); // Middleware to parse the request body
const path = require('path');
const { start } = require("repl");
const { assert } = require("console");
const ini = require('ini');

// const liveReloadServer = livereload.createServer();
// liveReloadServer.watch(path.join(__dirname, 'public'));

// app.use(connectLiveReload());
app.use(bodyParser.json());

let inColab = false;
googleDrivePath = '/content/drive/MyDrive';
if (fs.existsSync(googleDrivePath))
    inColab = true

const configFile = __dirname + "/" + (inColab ? 'configColab.ini' : "config.ini");
const fileContent = fs.readFileSync(configFile, 'utf8');
config = ini.parse(fileContent);
config.main.segmentBufferN = parseInt(config.main.segmentBufferN);
config.main.useNvenc = parseInt(config.main.useNvenc);
config.main.maxWidth = parseInt(config.main.maxWidth);
config.debug.useChildSpawn = parseInt(config.debug.useChildSpawn)

const socketPath = '/tmp/mpvsocketr';
const streamPath = __dirname + "/stream/";
let inputFile = "/home/amadeok/Downloads/Demon Slayer/01.mp4";
inputFile  = "/home/amadeok/Downloads/Star.Wars.Episode.III.Revenge.of.the.Sith.2005.REMASTERED.1080p.BluRay.x265-RBG.mp4"
const codec_hw_args = ["--ovc=h264_nvenc", "--ovcopts-add=preset=p1"]
const codec_sw_args = ["--ovc=libx264", "--ovcopts=b=11500000,preset=veryfast,minrate=11500000,maxrate=11500000,bufsize=23000000,g=60,keyint_min=60,threads=16"];

let args = [
    "--oac=aac", "--of=ssegment", "--ofopts=segment_time=2,segment_format=mpegts,segment_list_size=0,"
    + "segment_start_number=0,segment_list_flags=+live,segment_list=[" + streamPath + "out.m3u8]",
    "--input-ipc-server=/tmp/mpvsocketr", "--o=" + streamPath + "/str%06d.ts"];

let player = null;
let latestSSegment = null;
let latestCSegment = null;
let latestSSegmentInt = null;
const { spawn } = require('child_process');

function startMpv(file) {
    ffmpeg.setFfprobePath("ffprobe");
    resizeVF = ""
    ffmpeg.ffprobe(file, function (err, metadata) {
        if (err) {
            console.error(err);
        } else {
            if (file == undefined) file = inputFile;
            if (player != null) player.command("quit");
            if (latestSSegmentInt)
                clearInterval(latestSSegmentInt);
            player = null;
            exec("rm " + streamPath + "*", (error, stdout, stderr) => { });

            //console.log(metadata);
            let stream = null;
            for (var str of metadata.streams)
                if (str.codec_type == "video")
                    stream = str;

            videow = stream.width;
            if (videow > config.main.maxWidth) {
                resizeVF = "lavfi=[scale=" + config.main.maxWidth + ":-1],"
                console.log("Automatic downscaling: ", videow, "px to ", config.main.maxWidth, "px ")
            }
            const vfarg = "--vf='" + resizeVF + "vapoursynth:[" +  (inColab ? "/content/mlrt/" : "/home/amadeok/") 
            + "vs-mlrt/scripts/test3.py]':4:8";
            extr = '"';
            let binary = inColab  || 1 ? "LD_LIBRARY_PATH='/usr/lib64-nvidia:/usr/local/lib' " : "";
            binary += inColab ? ' /content/mpv_/mpv-build/mpv/build/mpv' : 'mpv';
            enc_args = config.main.useNvenc ? codec_hw_args : codec_sw_args;
         
            let strArgs = binary + " '" + file + "' " + enc_args.join(" ") +  " " +vfarg + " " +  args.join(" ");
            console.log("\n---> MPV COMAND: \n", strArgs, "\n");

            if (config.debug.useChildSpawn) {
                file =  ' "' + file + '" ';
                let listArgs = [file, ...enc_args, vfarg, ...args];
                console.log("\n---> MPV COMAND (arr): \n ", binary,  listArgs, "\n");

                const childProcess = spawn(binary, listArgs, {
                    stdio: 'inherit',
                     shell: true
                });
                // childProcess.stdout.on('data', (data) => {                console.log(`stdout: ${data.toString()}`);             });
                //  childProcess.on('error', (err) => {                console.error(`Error: ${err.message}`);            });
                //  childProcess.on('close', (code) => {                console.log(`Child process exited with code ${code}`);             });
            }
            else {
                exec(strArgs, (error, stdout, stderr) => {
                    if (error) { console.error(`Error occurred: ${error.message}`); return; }
                    if (stderr) { console.error(`stderr: ${stderr}`); return; }
                    console.log(`stdout: ${stdout}`);
                });
            }

            latestSSegmentInt = setInterval(getLatestHLSSegmentF, 3000);

            setTimeout(() => {
                const pl = new mpv.MPVClient(socketPath);
                //pl.command("cycle", "pause");
                //pl.command("quit");
                player = pl;
            }, 500);

        }
    });

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
    //  console.log("getlatest")
    const regex = /(\d+)/;
    if (latestsegment) {
        const number = latestsegment.match(regex)[0];
        latestSSegment = parseInt(number, 10);
        let d = latestSSegment - latestCSegment;
        console.log(`Server segment: ${latestSSegment} client segment ${latestCSegment} delta ${d}`);
        if (d > config.main.segmentBufferN) {
            player.getProperty("pause")
                .then((res) => {
                    if (!res) {
                        console.log("---> pausing delta <--- \n")
                        player.pause();
                    }
                }).catch((e) => { console.log(e) });
        }
        else {
            player.getProperty("pause")
                .then((res) => {
                    if (res) {
                        console.log("---> resuming delta <--- \n")
                        player.resume();
                    }
                }).catch((e) => { console.log(e) });
        }
    }
}
function startMpvEv(file) {
    startMpv(file);
}

//startMpvEv(inputFile);

// mpvProcess.stdout.on('data', (data) => {  console.log(`stdout: ${data}`);  });
// mpvProcess.stderr.on('data', (data) => {   console.error(`stderr: ${data}`); });
// mpvProcess.on('close', (code) => {  console.log(`child process exited with code ${code}`);  });


//const player = new mpv.MPVClient(socketPath);

let server = app.listen(config.main.port, inColab ? "127.0.0.1" : config.main.host, () => {
    console.log(`Server is listening at http://${config.main.host}:${config.main.port}`);

    if (inColab) {
        const ngrok = require('ngrok');
        (async function () {
            const url = await ngrok.connect(config.main.port);
            console.log(`Server is accessible from the internet at: ${url}`);
        })();
    }
});

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
    const directoryPath2 = path.join(config.main.mediadir, subfolder);

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
    const file_path = path.join(config.main.mediadir, file);
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
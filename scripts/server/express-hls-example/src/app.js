const express = require('express');
const app = express();
//const http = require('http').Server(app);

const fs = require('fs');
const hls = require('hls-server');
let mpv = require('mpv-ipc');
const { exec, spawnSync, childProcess } = require('child_process');
const child_process = require('child_process');

var ffmpeg = require('fluent-ffmpeg');
// var livereload = require("livereload");
// var connectLiveReload = require("connect-livereload");
//let path = require('path')

const bodyParser = require('body-parser'); // Middleware to parse the request body
const path = require('path');
const { start } = require("repl");
const { assert } = require("console");
const ini = require('ini');
let debugPaused = false;
// const liveReloadServer = livereload.createServer();
// liveReloadServer.watch(path.join(__dirname, 'public'));

// app.use(connectLiveReload());
app.use(bodyParser.json()); // THIS BREAKS /VIDEO METHOD

let inColab = false;
googleDrivePath = '/content/drive/MyDrive';
if (fs.existsSync(googleDrivePath))
    inColab = true

const configFile = inColab ? googleDrivePath + '/rifef/configColab.ini' : __dirname + "/config.ini";

function readINI(configFile_) {
    const fileContent = fs.readFileSync(configFile_, 'utf8');
    let config = ini.parse(fileContent);

    function convertToInt(obj) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (!isNaN(value)) {
                    obj[key] = parseInt(value);
                }
                if (typeof value === 'object' && value !== null) {
                    convertToInt(value);
                }
            }
        }
    }
    config = JSON.parse(JSON.stringify(config));
    convertToInt(config);
    return config;
}


function mergeConfigs(defaultConfig, userConfig) {
    function mergeProperties(defaultObj, userObj) {
        for (const key in defaultObj) {
            if (defaultObj.hasOwnProperty(key)) {
                // Check if the property is an object (nested section)
                if (typeof defaultObj[key] === 'object' && !Array.isArray(defaultObj[key])) {
                    // Recursively merge nested sections
                    userObj[key] = mergeProperties(defaultObj[key], userObj[key] || {});
                } else {
                    // Check if the property exists in userConfig, if not, add it from defaultConfig
                    if (!(key in userObj)) {
                        console.log(`Adding missing option "${key}" = ${defaultObj[key]}`)
                        userObj[key] = defaultObj[key];
                    }
                }
            }
        }
        return userObj;
    }

    return mergeProperties(defaultConfig, userConfig);
}

let defaultConfig = readINI(__dirname + "/configDef.ini"); 1
let config = readINI(configFile);
mergeConfigs(defaultConfig, config)

let usetimerPauser = false;

const socketPath = '/tmp/mpvsocketr2';
const streamPath = __dirname + "/stream/";
let inputFile = "/mnt/SAB/filmhuari/The.Two.Popes.2019.720p.NF.WEBRip.800MB.x264-GalaxyRG[TGx]/The.Two.Popes.2019.720p.NF.WEBRip.800MB.x264-GalaxyRG.mkv"
//inputFile = "/home/amadeok/Downloads/bnha92.mkv"
const codec_hw_args = ["--ovc=h264_nvenc", "--ovcopts-add=preset=p1"]
const codec_sw_args = ["--ovc=libx264", "--ovcopts=b=11500000,preset=veryfast,minrate=11500000,maxrate=11500000,bufsize=23000000,g=60,keyint_min=60,threads=16"];

let streamArgs = [
    "--oac=aac", "--of=ssegment", `--ofopts=segment_time=${config.main.segmentTime},segment_format=mpegts,segment_list_size=25,`
    + "segment_start_number=0,segment_list_flags=+live,segment_list=[" + streamPath + "out.m3u8]",
    "--o=" + streamPath + "/str%06d.ts",];

let otherArgs = ["--input-ipc-server=/tmp/mpvsocketr2", "-idle",
    config.debug.quiet ? "--really-quiet" : "",
    //"--script-opts=test3.py:multiplier=3"

]

let player = null;
let latestSSegment = null;
let latestCSegment = 0;
let latestSSegmentInt = null;
let timerPauseTimeout = null;
let clientPos = null;
const { spawn } = require('child_process');
const { execSync } = require('child_process');
const { setTimeout } = require('timers');

function setMPVnice() {
    const findProcessCommand = 'ps aux | grep mpv'; // Command to find MPV process
    const reniceCommand = 'sudo renice -n 20 -p [PID]'; // Command to set niceness to 20, replace [PID] with the actual process ID

    // Find the MPV process
    exec(findProcessCommand, (err, stdout, stderr) => {
        if (err) {
            console.error('Error finding MPV process:', err);
            return;
        }

        const lines = stdout.split('\n');
        lines.forEach((line) => {
            // Parse the process information to get the PID
            const columns = line.split(/\s+/);
            const pid = columns[1];

            // Set niceness of the MPV process
            if (pid && !isNaN(parseInt(pid))) {
                const reniceCmd = reniceCommand.replace('[PID]', pid);
                exec(reniceCmd, (reniceErr, reniceStdout, reniceStderr) => {
                    if (reniceErr) {
                        console.error(`Error setting niceness for PID ${pid}:`, reniceErr);
                    } else {
                        console.log(`Niceness set to 20 for PID ${pid}`);
                    }
                });
            }
        });
    });
}

function roundToMultipleOf32(number, dir) {
    if (!(dir == "up" || dir == "down"))
        throw new Error("dir undefined");

    return dir == "up" ? Math.ceil(number / 32) * 32 : Math.floor(number / 32) * 32;
}
function rNearestMultfTwo(number) { return Math.round(number / 2) * 2; }
function rNarestMult32(number) { return Math.round(number / 32) * 32; }
function check32(num1, num2) {
    if (num1 % 32 !== 0 || num2 % 32 !== 0)
        throw new Error('One of the numbers is not a multiple of 32.');
}
function getArgs(stream, file, incolab) {


    let binary = incolab || 1 ? `RIFEF_CONFIG_FILE='${configFile}' LD_LIBRARY_PATH='/usr/lib64-nvidia:/usr/local/lib' ` : " ";
    binary += incolab ? ' /content/mpv_/mpv-build/mpv/build/mpv' : 'mpv';
    incolab = true;
    inColab_ = incolab;

    aspectr = config.main.aspectRatio;

    crop1VF = "", crop2VF = "", padVF = "";
    const parts = aspectr.split(':');
    const awidth = parseInt(parts[0]);
    const aheight = parseInt(parts[1]);
    ///let newW = stream.width, newH = stream.height;
    let cropRes = "", scaleRes = "", padRes = "", cropRes2 = "", cropScaleVF = "";
    let f = awidth / aheight, f2 = stream.width / stream.height;
    let dif = Math.abs(f - f2);

    let needsRatioCrop = f > f2 && dif > 0.03;

    if (!needsRatioCrop)
        console.log("[WARNING] User aspectRatio (" + aspectr + ") ignored because it has to be more panoramic than input aspect ratio e.g: 21:9 for an 16:9 input",)

    let needsDownscaling = stream.width > config.main.maxWidth
    let crop1W, crop1H, scaleW, scaleH, crop2W, crop2H, padW, padH;
    let iw = stream.width, ih = stream.height;
    let srcRes = `${stream.width}:${stream.height}`;
    console.log("needsRatioCrop ", needsRatioCrop, " needsDownscaling: ", needsDownscaling, " inColab_ ", inColab_);
    if (needsRatioCrop && needsDownscaling) {

        scaleW = roundToMultipleOf32(config.main.maxWidth, "up");
        scaleH = (config.main.maxWidth / iw) * ih;

        crop1W = scaleW;
        crop1H = roundToMultipleOf32(scaleW / f, "up");

        let dd2 = Math.abs(crop1W / crop1H - f);
        console.log("dd2 ", dd2);
        if (dd2 > 0.2) throw new Error(`dd > 0.03: ${dd2}`);
        // scaleW = roundToMultipleOf32(scaleW_, inColab_ ? "down" : "up");
        // scaleH = roundToMultipleOf32(scaleH_, inColab_ ? "down" : "up");
        crop1W = Math.round(crop1W);
        crop1H = Math.round(crop1H);
        scaleH = Math.round(scaleH);
        scaleW = Math.round(scaleW);
        cropRes = `${crop1W}:${crop1H}`
        //let scaleRes_ = `${scaleW_}:${Math.round(scaleH_)}`
        scaleRes = `${scaleW}:${scaleH}`

        resizeVF = `lavfi=[scale=${scaleRes}],`;
        cropVF = `crop=${cropRes},`;

        cropScaleVF += resizeVF;
        cropScaleVF += cropVF;

        console.log(`Automatic downscaling    :  ${srcRes}  ->   ${scaleRes} -> ${cropRes} -> RIFE `)
        console.log(`Automatic cropping (${aspectr}):  ${srcRes}  ->   ${cropRes}  -> RIFE`)
        check32(crop1W, crop1H);
    }
    else if (needsRatioCrop) {

        crop1W = roundToMultipleOf32(iw, "down");
        crop1H = roundToMultipleOf32(iw / f, "up");
        cropRes = `${crop1W}:${crop1H}`
        cropVF = `crop=${cropRes},`;
        cropScaleVF += cropVF;

        console.log(`Automatic cropping (${aspectr}):  ${srcRes} -> ${cropRes} -> RIFE`)
        check32(crop1W, crop1H);
    }
    else if (needsDownscaling) {
        if (inColab_) {
            scaleW = rNarestMult32(config.main.maxWidth);
            scaleH = rNarestMult32((config.main.maxWidth / iw) * ih);
            scaleRes = `${scaleW}:${scaleH}`
            resizeVF = `lavfi=[scale=${scaleRes}],`;
            cropScaleVF += resizeVF;
            console.log(`Automatic downscaling: ${srcRes}  ->   ${scaleRes}  `)
            check32(scaleW, scaleH);
        } else {
            scaleW = Math.round(config.main.maxWidth);
            scaleH = Math.round((config.main.maxWidth / iw) * ih);

            scaleRes = `${scaleW}:${scaleH}`
            resizeVF = `lavfi=[scale=${scaleRes}],`;

            padW = roundToMultipleOf32(scaleW, "up");
            padH = roundToMultipleOf32(scaleH, "up");
            padRes = `${padW}:${padH}`;
            padVF = `pad=${padRes}:0:0:black,`

            crop2W = scaleW; crop2H = scaleH;
            cropRes2 = `${crop2W}:${crop2H}`;
            crop2VF = `,crop=${cropRes2}`;

            cropScaleVF += resizeVF;
            cropScaleVF += padVF;
            // cropScaleVF += crop2VF;
            console.log(`Automatic downscaling: ${srcRes} -> ${scaleRes} -> ${padRes} -> RIFE -> ${cropRes2}  `)
            check32(padW, padH);
        }

    }
    else {
        if (inColab_) {
            crop1W = roundToMultipleOf32(iw, "down");
            crop1H = roundToMultipleOf32(ih, "down");
            cropRes = `${crop1W}:${crop1H}`;
            crop1VF = `crop=${cropRes},`;
            cropScaleVF += crop1VF;
            console.log(`Automatic cropping for RIFE: ${srcRes}  ->   ${cropRes} -> RIFE  `)
            check32(crop1W, crop1H);
        }
        else {
            padW = roundToMultipleOf32(iw, "up");
            padH = roundToMultipleOf32(ih, "up");
            padRes = `${padW}:${padH}`;
            padVF = `pad=${padRes}:0:0:black,`

            crop2W = iw; crop2H = ih;
            cropRes2 = `${crop2W}:${crop2H}`;
            crop2VF = `,crop=${cropRes2}`;

            cropScaleVF += padVF;
            // cropScaleVF += crop2VF;
            console.log(`Automatic downscaling: ${srcRes}  ->   ${padRes} -> RIFE -> ${cropRes2}  `)
            check32(padW, padH);
        }
    }
    //console.log("cropScaleVF ", cropScaleVF);


    let scriptPath1 = "/content/mlrt/vs-mlrt/scripts/test3.py"
    let scriptPath2 = "/home/amadeok/vs-mlrt/scripts/test3.py"
    const [numerator, denominator] = stream.r_frame_rate.split('/').map(Number);
    let result;
    if (!isNaN(numerator) && !isNaN(denominator)) {
        result = numerator * config.main.conf; // Replace OUTPUT_MULTIPLE with your desired multiple
        console.log("Output frame rate:", result);
    } else {
        console.log("Invalid input frame rate format.");
    }

    let vfarg = "--vf='" + cropScaleVF + "vapoursynth:[" + (fs.existsSync(scriptPath1) ? scriptPath1 : scriptPath2) + "]" + crop2VF + `,fps=${result}` + "'"; //:4:8
    // vfarg = "";
    console.log("vfarg ", vfarg);
    enc_args = config.main.useNvenc ? codec_hw_args : codec_sw_args;

    return { enc_args: enc_args, vfarg: vfarg, binary: binary };
}


// while (1) {
//     let width = Math.floor(Math.random() * (3001 - 400) + 400); // Random width between 400 and 3000
//     let height = Math.floor(Math.random() * (3001 - 400) + 400); // Random height between 400 and 3000

//     let newObject = {
//         width: width,
//         height: height
//     };

//     let newObject2 = {
//         width: height,
//         height: width
//     }
//     if (height > width)
//         newObject = newObject2;
//     console.log("\n", newObject)
//    //  newObject.width = 1055;
//    // newObject.height = 505;
//     getArgs(newObject, "", 0);
//     getArgs(newObject, "", 1);

// }


function startMpv(file) {
    ffmpeg.setFfprobePath("ffprobe");
    resizeVF = ""
    return new Promise((resolve, reject) => {

        ffmpeg.ffprobe(file, function (err, metadata) {
            if (err) {
                console.error("FFprobe error ", err);
                reject(err);
            } else {
                try
                {

                if (file == undefined) file = inputFile;
                if (player != null) { player.command("quit"); console.log("\n---> quitting mpv <---\n") }
                if (latestSSegmentInt)
                    clearInterval(latestSSegmentInt);
                player = null;
                let delcmd = "rm -f " + streamPath + "*";
                execSync (delcmd);

                //console.log(metadata);
                let stream = null;
                for (var str of metadata.streams)
                    if (str.codec_type == "video")
                        stream = str;

                let args = getArgs(stream, file, inColab);
                let strArgs = args.binary + " '" + file + "' " + enc_args.join(" ") + " " + args.vfarg + " " + streamArgs.join(" ") + otherArgs.join(" ");
                console.log("\n---> MPV COMAND: \n", strArgs, "\n");

                if (config.debug.useChildSpawn) {
                    file = ' "' + file + '" ';
                    let listArgs = [file, ...args.enc_args, args.vfarg, ...streamArgs, ...otherArgs];
                    console.log("\n---> MPV COMAND (arr): \n ", args.binary, listArgs, "\n");

                    const cp = spawn(args.binary, listArgs, {
                        stdio: 'inherit',
                        shell: true
                    });
                    // console.log("\n\nNICENESS");

                    // try {
                    //     const stdout = execSync('ps aux | grep mpv').toString();
                    //     const processes = stdout.split('\n').filter(line => line.includes('mpv'));
                    //     processes.forEach(processInfo => {
                    //         const columns = processInfo.trim().split(/\s+/);
                    //         const pid = columns[1];
                    //         spawnSync('renice', ['-n', "-19", '-p', pid] , { stdio: 'inherit', shell: true});
                    //         const niceness = columns[17]; // Niceness value is usually found at index 17
                    //         const ret = spawnSync("ps", ["-o", "pid,ni,cmd", "-p", pid], {
                    //             stdio: 'inherit',
                    //             shell: true
                    //         });
                    //         //console.log(`PID: ${pid}, Niceness: ${niceness}`);
                    //     });
                    // } catch (error) {
                    //     console.error(`Error: ${error.message}`);
                    // }
                    //console.log("NICENESS\n\n");

                    // childProcess.stdout.on('data', (data) => {                console.log(`stdout: ${data.toString()}`);             });
                    //  childProcess.on('error', (err) => {                console.error(`Error: ${err.message}`);            });
                    //  childProcess.on('close', (code) => {                console.log(`Child process exited with code ${code}`);             });
                }
                else {
                    exec(args.strArgs, (error, stdout, stderr) => {
                        if (error) { console.error(`Error occurred: ${error.message}`); return; }
                        if (stderr) { console.error(`stderr: ${stderr}`); return; }
                        console.log(`stdout: ${stdout}`);
                    });
                }
                // if (!usetimerPauser)
                checkFile(streamPath + "out.m3u8", () => {
                    console.log(`File ${streamPath + "out.m3u8"} exists, starting segment check`);
                    latestSSegmentInt = setInterval(getLatestHLSSegmentF, 10000);
                    //res.json({ message: 'File exists, opening...' });
                });

                setTimeout(() => {
                    const pl = new mpv.MPVClient(socketPath);
                    //pl.command("cycle", "pause");
                    //pl.command("quit");
                    player = pl;
                }, 500);
                resolve(metadata);
            }
            catch (error) {
                console.error('Caught an error:', error.message);
                reject(error.message);
              }
            }
        });
    })
}



function getLatestHLSSegment(folderPath) {

    fs.readFile(streamPath + '/out.m3u8', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }
        const lines = data.split('\n');
        const lastLine = lines[lines.length - 1] == "" ? lines[lines.length - 2] : lines[lines.length - 1];

    });
    // const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.ts')); // Assuming HLS segments have a .ts extension
    // if (files.length === 0) {
    //     return null; // No HLS segments found in the folder
    // }
    // const latestSSegment = files.reduce((prev, current) => {
    //     const prevTimestamp = fs.statSync(path.join(folderPath, prev)).mtimeMs;
    //     const currentTimestamp = fs.statSync(path.join(folderPath, current)).mtimeMs;
    //     return prevTimestamp > currentTimestamp ? prev : current;
    // });
    // return latestSSegment;
}

function getLatestHLSSegmentF() {
    //let latestsegment = getLatestHLSSement(streamPath);
    //  console.log("getlatest")
    if (!debugPaused)
        fs.readFile(streamPath + '/out.m3u8', 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                return;
            }
            const lines = data.split('\n');
            const latestsegment = lines[lines.length - 1] == "" ? lines[lines.length - 2] : lines[lines.length - 1];

            const regex = /(\d+)/;
            if (latestsegment) {
                let partial = latestsegment.match(regex);
                if (!partial)
                    return;
                const number = partial[0];
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
        });

}

function startMpvEv(file) {
    startMpv(file);
}

//startMpvEv(inputFile);

// mpvProcess.stdout.on('data', (data) => {  console.log(`stdout: ${data}`);  });
// mpvProcess.stderr.on('data', (data) => {   console.error(`stderr: ${data}`); });
// mpvProcess.on('close', (code) => {  console.log(`child process exited with code ${code}`);  });


//const player = new mpv.MPVClient(socketPath);
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
    config = readINI(configFile);
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


function tcpPlay(file, req, res) {
    ffmpeg.setFfprobePath("ffprobe");
    resizeVF = ""
    ffmpeg.ffprobe(file, function (err, metadata) {
        if (err) {
            console.error(err);
        } else {
            if (file == undefined) file = inputFile;
            if (player != null) player.command("quit");
            player = null;

            let stream = null;
            for (var str of metadata.streams)
                if (str.codec_type == "video")
                    stream = str;

            let args = getArgs(stream, file);

            res.setHeader('Content-Type', 'video/mpegts');

            const pathToFifo = '/tmp/mpvfifo2';

            try {
                fs.unlinkSync(pathToFifo);
                child_process.spawnSync("mkfifo", [pathToFifo]);
            } catch (err) { console.error(`Error deleting named pipe: ${err.message}`); }

            let listArgs = [`'${file}'`, "--of=mpegts", ...args.enc_args, args.vfarg, "-o", pathToFifo, ...otherArgs];
            const ffmpegProcess = spawn(args.binary, listArgs, {  //  stdio: 'inherit',   
                shell: true
            });
            setTimeout(() => {
                const pl = new mpv.MPVClient(socketPath);
                //pl.command("cycle", "pause");
                //pl.command("quit");
                player = pl;
            }, 500);

            if (fs.existsSync(pathToFifo)) {
                const fifoStream = fs.createReadStream(pathToFifo);
                //  fifoStream.on('data', (data) => {
                //    res.send(data);
                // //   //console.log('Received data from FIFO:', data.toString());

                //  });
                fifoStream.pipe(res)

                fifoStream.on('error', (err) => { console.error('Error reading from FIFO:', err); });
                fifoStream.on('end', () => { console.log('End of FIFO stream'); });
            } else { console.error('FIFO file does not exist.'); }

            //ffmpegProcess.stdout.pipe(res);

            ffmpegProcess.stderr.on('data', (data) => {
                console.error(`FFmpeg stderr: ${data}`);
            });

            ffmpegProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`FFmpeg process exited with code ${code}`);
                }
            });

            req.on('close', () => {
                console.log("Connection closed ")
                if (player != null) player.command("quit");

                ffmpegProcess.kill();
            });
        }
    });
}

app.get('/video', (req, res) => {
    tcpPlay(inputFile, req, res)
});


app.get('/video2', (req, res) => {

    res.setHeader('Content-Type', 'video/mpegts');

    const pathToFifo = '/tmp/mpvfifo2';

    try {
        fs.unlinkSync(pathToFifo);
        child_process.spawnSync("mkfifo", [pathToFifo]);

        child_process.spawnSync("mkfifo", [pathToFifo]);
    } catch (err) {
        console.error(`Error deleting named pipe: ${err.message}`);
    }


    const ffmpegProcess = child_process.spawn('mpv', [
        //'/home/amadeok/Downloads/Demon Slayer/01.mp4', // FFmpeg input stream URL
        '"/home/amadeok/Downloads/Demon Slayer/1.mkv"', // FFmpeg input stream URL
        //'--no-cache',
        // "--o=-",
        "--of=mpegts",
        //"--ovc=copy",
        //  "--oac=pcm_s16le",
        "--ovc=h264_nvenc",
        "--ovcopts-add=preset=p1",
        "--vf='lavfi=[scale=iw/2:-1],vapoursynth:[/home/amadeok/vs-mlrt/scripts/test3.py]':4:8",
        //  "--vf='vapoursynth:[/home/amadeok/vs-mlrt/scripts/test3.py]':4:8",
        "-o",
        pathToFifo
        //"-"
    ], {
        //  stdio: 'inherit',
        shell: true
    });


    if (fs.existsSync(pathToFifo)) {
        const fifoStream = fs.createReadStream(pathToFifo);
        //  fifoStream.on('data', (data) => {
        //    res.send(data);
        // //   //console.log('Received data from FIFO:', data.toString());

        //  });
        fifoStream.pipe(res)

        fifoStream.on('error', (err) => { console.error('Error reading from FIFO:', err); });
        fifoStream.on('end', () => { console.log('End of FIFO stream'); });
    } else { console.error('FIFO file does not exist.'); }

    //ffmpegProcess.stdout.pipe(res);

    ffmpegProcess.stderr.on('data', (data) => {
        console.error(`FFmpeg stderr: ${data}`);
    });

    ffmpegProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`FFmpeg process exited with code ${code}`);
        }
    });

    req.on('close', () => {
        ffmpegProcess.kill();
    });
});
function checkIfDirectoryEmpty(directoryPath) {
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            fs.readdir(directoryPath, (err, files) => {
                if (err) {
                    clearInterval(interval);
                    reject(err);
                }

                if (files.length === 0) {
                    clearInterval(interval);
                    resolve();
                }
            });
        }, 1000); // Check every 1 second (you can adjust the interval as needed)
    });
}

app.get('/mpv-play-file', (req, res) => {

    config = readINI(configFile);
    const file = req.query.file || ''; // Get subfolder path from query parameter
    const useTCP = req.query.useTCP == "true" // Get subfolder path from query parameter

    const file_path = path.join(config.main.mediadir, file);
    console.log('\n ---> Requested file:', file_path, " ; useTCP ", useTCP, " <---\n");
    if (fs.existsSync(file_path)) {
        if (!useTCP) {
            let ret = startMpv(file_path);
            ret.then(() => {
                // console.log("\n---> startMPV then", ret, " <--- \n");

                // checkIfDirectoryEmpty(streamPath)
                //     .then(() => {
                console.log('\n -->Stream files deleted, proceeding..  <-- \n');
                checkFile(streamPath + "str000001.ts", () => {
                    console.log(`File ${streamPath + "str000001.ts"} exists.`);

                    player.getProperty('track-list').then(tr => {
                        console.log("\n --> Got file track-list <-- \n");
                        res.json({ trackList: tr, message: "success getting tack list " });
                        //if (usetimerPauser) timedPaused();
                    }).catch((error) => {
                        console.log(error);
                        res.status(500).json({ error: "Error gettin track" });

                    })

                    //res.json({ message: 'File exists, opening...' });
                });        //
                // })
                // .catch((err) => {
                //     console.error('\n --> Error checking directory:  <-- \n', err);
                //     res.status(500).json({ error: { message: 'Failed to check directory' } });

                // });
                //setTimeout(() => {
                // }, 1000);
            }).catch((err) => {

                console.error('\n --> Error opening file:  <-- \n', err);
                res.status(500).json({ error: { message: 'Failed to open file' } });
            });


        } else {
            inputFile = file_path;
            console.log("\n -->  Can open video with player  <-- \n", inputFile);
            res.json({ trackList: inputFile });
        }

    } else {
        res.status(500).json({ error: { message: "\n -->  File doesn't exist" } });
    }

});



app.post('/mpv-pause-cycle', async (req, res) => {
    try {
        //   const isMpvPaused = await player.getProperty("pause");
        //   if (isMpvPaused)   player.resume();
        //     else  player.pause();
        console.log("Cycle pause");
        let ret = player.command("cycle", "pause");
        ret.then((res) => {
            player.getProperty("pause")
                .then((res) => {
                    if (res) {
                        console.log("---> debug Pause ON <--- \n")
                        debugPaused = true;
                    } else {
                        console.log("---> debug Pause OFF <--- \n")
                        debugPaused = false;
                    }
                }).catch((e) => { console.log(e) });
        }).catch((e) => { console.log(e) });
        res.json({ message: 'Cycle command received successfully.' });

    } catch (error) {
        console.error('Error  occurred:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/mpv-track-req', async (req, res) => {
    try {
        console.log("Cycle subtitle");
        const postData = req.body;
        console.log(req.body)
        if (player) {
            if (req.body.reqtype == "cycle") {
                player.command("cycle", req.body.which).then(sub => {
                    player.getProperty(`current-tracks/${req.body.which}`).then(mpvres => {
                        res.json({ reqRes: mpvres });
                    }).catch(
                        (error) => { console.log(error); res.json({ reqRes: { title: "None" } }); })
                }).catch((error) => { console.log(error); res.json({ reqRes: { title: "Cycle failed" } }); })
            } else {
                player.getProperty(`current-tracks/${req.body.which}`).then(mpvres => {
                    res.json({ reqRes: mpvres });
                }).catch(
                    (error) => { console.log(error); res.json({ reqRes: { title: "None" } }); })
            }

        } else
            res.json({ reqRes: { title: "No file playing" } });


    } catch (error) {
        console.error('Error  occurred:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/mpv-seek', (req, res) => {
    const sliderValue = req.body.sliderValue;
    //clientPos = 0;
    player.getDuration()
        .then((duration) => {

            let newPos = (sliderValue / 1000) * duration;
            console.log('Slider Value:', sliderValue, " Seek pos: ", newPos, " Dur: ", duration);
            player.seek(newPos, 'absolute');
            //    if (usetimerPauser) timedPaused();
        })
        .catch((error) => { console.log(error); })

    res.json({ message: 'Slider value received successfully.' });
});


app.post('/mpv-get-perc-pos', (req, res) => {

    const clientPlaybackD = req.body.clientPlaybackD;
    if (player)
        player.getDuration()
            .then((duration) => {
                player.getProperty('playback-time').then(pos => {
                    let sliderPos = (pos / duration) * 1000;
                    //let delta = clientPlaybackD;
                    //console.log('Server pos', pos.toFixed(2), " delta  ", delta.toFixed(2), " slider pos: ", sliderPos.toFixed(2), " Dur: ", duration);
                    console.log('Server pos', pos.toFixed(2), " slider pos: ", sliderPos.toFixed(2), " Dur: ", duration);
                    //if (clientPos)
                    // if (delta > config.main.segmentTime * config.main.pausePlayTimeMult) {
                    //     player.getProperty("pause")
                    //         .then((res) => {
                    //             if (!res) {
                    //                 console.log("---> pausing delta <--- \n")
                    //                 player.pause();
                    //             }
                    //         }).catch((e) => { console.log(e) });
                    // }
                    // else {
                    //     player.getProperty("pause")
                    //         .then((res) => {
                    //             if (res) {
                    //                 console.log("---> resuming delta <--- \n")
                    //                 player.resume();
                    //             }
                    //         }).catch((e) => { console.log(e) });
                    // }

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

// Start the Express server

// let server = http.listen(config.main.port, inColab ? "127.0.0.1" : config.main.host, () => {
//         console.log(`Server is listening at http://${config.main.host}:${config.main.port}`);

//         if (inColab) {
//             const ngrok = require('ngrok');
//             (async function () {
//                 const url = await ngrok.connect(config.main.port);
//                 console.log(`Server is accessible from the internet at: ${url}`);
//             })();
//         }
//     });

function timedPaused(customtime) {
    if (!player) return;
    if (timerPauseTimeout)
        clearTimeout(timerPauseTimeout);

    player.resume();
    let time = customtime ? customtime : Math.max(config.main.segmentTime * 4 * 1000, 20 * 1000)
    timerPauseTimeout = setTimeout(() => {
        console.log("----> timed pause ", time)
        player.pause();
    }, time);
}

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

new hls(server, {
    provider: {
        exists: (req, cb) => {
            const ext = req.url.split('.').pop();

            if (ext !== 'm3u8' && ext !== 'ts') {
                return cb(null, true);
            }
            let last = false;
            if (ext == 'ts') {
                const regex = /(\d+)/;
                const numberS = req.url.match(regex)[0];
                const number = parseInt(numberS, 10);
                console.log("numer ", number, " latestCSegment ", latestCSegment, "numberS", numberS);
                if (number > latestCSegment) {
                    latestCSegment = Math.min(latestSSegment, number);
                    last = true;
                }
            }
            //  else if (usetimerPauser && ext == 'ts') {
            //     timedPaused();
            // }
            console.log("GET received: " + req.url + (last ? "*" : ""))
            fs.access(__dirname + req.url, fs.constants.F_OK, function (err) {
                if (err) {
                    console.log('File not exist'); //                    checkFile(`${__dirname}/${req.url}`)

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


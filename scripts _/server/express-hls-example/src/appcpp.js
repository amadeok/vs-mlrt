console.log("Start")
const express = require('express');
const app = express();
//const http = require('http').Server(app);
const fs = require('fs');
const hls = require('hls-server');
//let mpv = require('mpv-ipc');
const { exec, spawnSync, childProcess } = require('child_process');
const child_process = require('child_process');
//var ffmpeg = require('fluent-ffmpeg');
const bodyParser = require('body-parser'); // Middleware to parse the request body
const path = require('path');
const { start } = require("repl");
const { assert } = require("console");
const ini = require('ini');
const { spawn } = require('child_process');
const { execSync } = require('child_process');
const { setTimeout } = require('timers');
const os = require('os');
const AdmZip = require('adm-zip');

const WebSocket = require('ws');

PORT = 45145
HOST = null

let debugPaused = false;
let bIsRemotePaused = {type: "noAction", id: "0"};
const remotePauseEnum = { pauseQueued: 1, playQueued: 2, noAction: 0 }
let playSessionId = null, prevPlaySessionId = null, mirroringMode = null;
let responseCaches  = new Map()
let streamPath = null;

// const liveReloadServer = livereload.createServer();
// liveReloadServer.watch(path.join(__dirname, 'public'));
// app.use(connectLiveReload());
app.use(bodyParser.json()); // THIS BREAKS /VIDEO METHOD

let inColab = false;
// googleDrivePath = '/content/drive/MyDrive';
// if (fs.existsSync(googleDrivePath))
//     inColab = true

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

// let defaultConfig = readINI(__dirname + "/configDef.ini"); 1
let config = null;// readINI(configFile);
// mergeConfigs(defaultConfig, config)
////'\\.ts$,\\.m3u8$\\client.js'",
let usetimerPauser = false;

const socketPath = '/tmp/mpvsocketr2';
const streamPath1 = __dirname + "/stream/";
let inputFile = "/mnt/SAB/filmhuari/The.Two.Popes.2019.720p.NF.WEBRip.800MB.x264-GalaxyRG[TGx]/The.Two.Popes.2019.720p.NF.WEBRip.800MB.x264-GalaxyRG.mkv"
//inputFile = "/home/amadeok/Downloads/bnha92.mkv"
const codec_hw_args = ["--ovc=h264_nvenc", "--ovcopts-add=preset=p1"]
const codec_sw_args = ["--ovc=libx264", "--ovcopts=b=11500000,preset=veryfast,minrate=11500000,maxrate=11500000,bufsize=23000000,g=60,keyint_min=60,threads=16"];

let streamArgs = [
    "--oac=aac", "--of=ssegment", `--ofopts=segment_time=10,segment_format=mpegts,segment_list_size=25,`
    + "segment_start_number=0,segment_list_flags=+live,segment_list=[" + streamPath1 + "out.m3u8]",
    "--o=" + streamPath1 + "/str%06d.ts",];

// let otherArgs = ["--input-ipc-server=/tmp/mpvsocketr2", "-idle",
//     config.debug.quiet ? "--really-quiet" : "",
//     //"--script-opts=test3.py:multiplier=3"
// ]

let player = null;
let latestSSegment = null;
let latestCSegment = 0;
let latestSSegmentInt = null;
let timerPauseTimeout = null;
let clientPos = null;
var recvVariables = {};


function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}



class WebSocketClient {
    constructor(host) {
        this.HOST = host;
        this.messageCallbacks = new Map();
        this.messageIntervals = new Map();
        this.counter = 0
        this.createSocket();
        // for (let i = 0; i < 300; i++) {
        //     this.messageCallbacks.push(undefined);
        //   }
        setInterval(() => {

            if (this.socket.readyState !== WebSocket.OPEN) {
                for (let [key, value] of this.messageCallbacks.entries())      this.messageCallbacks.set(key, {delete: "yes"} );

                //for (let n = 0; n < this.counter+10; n++) this.messageCallbacks[n] = null;
                this.waitUntilEmpty(this.messageCallbacks,  1500, () => {
                    this.createSocket();
                })
            }
             //else   //   console.log('socket exists');// this.socket.send('succesive msg from client ' + document.title);
        }, 10000);

    }

    waitUntilEmpty(dictionary, interval, callback) {
        const checkEmpty = () => {
            this.emptyDict(); 
            console.log("Waiting until empty", dictionary.size);
             if (dictionary.size === 0) { 
                clearInterval(intervalId );
                callback();
            }
        };
        const intervalId = setInterval(checkEmpty, interval);
    }
    emptyDict() {
        for (let [key, value] of this.messageCallbacks.entries())  {
            console.log("ksetting key ", key, value);
             this.messageCallbacks.set(key, {delete: "yes"} );
             this.messageCallbacks.delete(key);

        }
    }
    createSocket() {
        try {
            for (let [key, value] of this.messageCallbacks.entries())  {
                console.log("ksetting key ", key, value);
                 this.messageCallbacks.set(key, {delete: "yes"} );
            } 
            console.log("Creating new websocket:  ", this.HOST);
            this.socket = new WebSocket(this.HOST);
            this.socket.addEventListener('open', this.onOpen.bind(this));
            //this.socket.addEventListener('message', this.onMessage.bind(this));
            this.socket.addEventListener('close', this.onClose.bind(this));
            this.socket.addEventListener('error', (error) => {
                console.error('WebSocket error:', error);
            });
            this.socket.addEventListener('message', (event) => {
                const receivedMessage = event.data;
                const messageData = JSON.parse(receivedMessage);

                if (messageData.id) // && //this.messageCallbacks.has(messageData.id))
                {
                    // if (messageData.message && messageData.message.type == "request_local_ip") {
                    //     this.socket.send(JSON.stringify( {id: messageData.id, message: { host: HOST, port: PORT} }));
                    // }
                    // else {
                        this.messageCallbacks.set(messageData.id, messageData);    
                  //  }

                    //  this.messageCallbacks[parseInt( messageData.id) ] =  messageData;
                }
                else {
                    console.log('Received message:', receivedMessage);
                    if (messageData.type === 'variables') {
                        var variablesObject = messageData["variables"];
                        for (var key in variablesObject) {
                            if (variablesObject.hasOwnProperty(key)) {
                                recvVariables[key] = variablesObject[key];
                                //console.log(key + ": " + variablesObject[key]);
                            }
                        }
                    }else if (messageData.type == "data"  && messageData.resposeOf == "get_duration_and_curtime"){
                        let browserCurTime = messageData.data.video_curTime
                        let browserDuration = messageData.data.video_duration
                        console.log("Received data get_duration_and_curtime ", browserCurTime, browserDuration)

                    } else if (messageData.type == "new_session_notice") {
                        prevPlaySessionId = playSessionId;
                        playSessionId = messageData.play_session_id;
                        mirroringMode = messageData.mirroring_mode;
                        if (prevPlaySessionId !== playSessionId) {
                            console.log("New play session: ", playSessionId, " mirroring mode: ", mirroringMode);
                            latestCSegment = 0;
                            latestSSegment = 0;
                            responseCaches.clear();
                        }
                    }
                }
            });
            if (latestSSegmentInt)
                clearInterval(latestSSegmentInt);
            latestSSegmentInt = setInterval(getLatestHLSSegmentF, 10000);
        } catch (error) {
            console.log("Error creating websocket: ", error);
        }


    } 
    waitForValueToBecomeOne(key, this_) {
        let count = 0;
        return new Promise((resolve) => {
          function checkValue() {
            //let value = this_.messageCallbacks[key]//.get(key)
            let value = this_.messageCallbacks.get(key)

            if (value != null || this_.socket.readyState !== WebSocket.OPEN || value && value.delete) {
              console.log(`(${this_.messageCallbacks.size}) ${key} has become change!`);
              this_.messageCallbacks.delete(key);
              //this_.messageCallbacks[key] = null;
              resolve(value);
            } else {
                if (count++ % 4 == 0)
                console.log(`Waiting for ${key} to change...`);
              setTimeout(checkValue, 300); // Check again after 1 second
            }
          }
          checkValue();
        });
      }
      
      
     sendWithCallback(message) {
        const requestId = generateUniqueId();
        const callback = (response) => { console.log('Received response:', response);        };
        //this.messageCallbacks[requestId] = null;
        //this.messageCallbacks.set(requestId, null);
        this.messageCallbacks.set(requestId, null);

      //  const data = {           id: requestId,            message: message        };
        const jsonData = JSON.stringify(data);
        this.socket.send(jsonData);
        return requestId; // You can use this identifier to track the response
    }

    sendWithResponse(message, useUniqueId=true) {
        return new Promise((resolve, reject) => {
            
            let requestId = (useUniqueId ?  generateUniqueId() : "") + "_" + message.type ;
            if (message.operation_type) requestId += "_"+message.operation_type;
            if (message.property_name) requestId += "_"+message.property_name;
            if (this.socket.readyState !== WebSocket.OPEN || this.messageCallbacks.has(requestId))
            return;
           // this.messageCallbacks[requestId] = null;
            this.messageCallbacks.set(requestId, null);
            //let requestId = this.counter;
            this.counter +=1;
            //this.messageCallbacks[requestId] = null;
            const data = { id: requestId, message: message };
            const jsonData = JSON.stringify(data);

            this.socket.send(jsonData);

            this.waitForValueToBecomeOne(requestId, this)
                .then(innerResult => {
                    resolve(innerResult);
                })
                .catch(innerError => {
                    reject(`Outer Promise Rejected with: ${innerError}`);
                });
        });
    }
    onOpen(event) {
        console.log('Connected to server');
        
        this.socket.send(JSON.stringify({ type: "id_handshake", client_type: 'hls_server', host: HOST, port: PORT }));

        myWebSocket.sendWithResponse({ type: "get_player_status" })
            .then(messageData => {
                if (messageData && messageData.player_status == "STARTING" || messageData && messageData.player_status == "RUNNING") {
                    if (latestSSegmentInt)
                        clearInterval(latestSSegmentInt);
                    latestSSegmentInt = setInterval(getLatestHLSSegmentF, 10000);
                }
            }).catch(err => { console.log(`Error checking mpv-is-player: ${err}`); });


        // const requestId = this.sendWithResponse('Hello, server!')
        // .then(innerResult => {
        //     console.log(`ok: ${innerResult}`);
        // })
        //     .catch(innerError => {
        //         console.log(`not ok: ${innerError}`);
        //     });

    }



    onMessage(event) {
        const message = JSON.parse(event.data);
        console.log("message ", message)
        if (message.type === 'variables') {
            var variablesObject = message["variables"];
            for (var key in variablesObject) {
                if (variablesObject.hasOwnProperty(key)) {
                    recvVariables[key] = variablesObject[key];
                    //console.log(key + ": " + variablesObject[key]);
                }
            }
        }

        if (message.type === 'perform_operation') { }
        else if (message.type === 'message') { }
    }

    onClose(event) {
         for (let [key, value] of this.messageCallbacks.entries())  
             this.messageCallbacks.set(key, {delete: "yes"} );
        
        //for (n = 0; n < this.counter+10; n++)  this.messageCallbacks[n] = null;

        console.log('Connection closed');
    }
}

myWebSocket = new WebSocketClient('ws://127.0.0.1:65432');
console.log("websocket created on start for ", myWebSocket.HOST);
myWebSocket.emptyDict()

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
    maxWidth = 4000
    aspectr = "16/9";// config.main.aspectRatio;

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

    let needsDownscaling = stream.width > 1;//maxWidth
    let crop1W, crop1H, scaleW, scaleH, crop2W, crop2H, padW, padH;
    let iw = stream.width, ih = stream.height;
    let srcRes = `${stream.width}:${stream.height}`;
    console.log("needsRatioCrop ", needsRatioCrop, " needsDownscaling: ", needsDownscaling, " inColab_ ", inColab_);
    if (needsRatioCrop && needsDownscaling) {

        scaleW = roundToMultipleOf32(maxWidth, "up");
        scaleH = (maxWidth / iw) * ih;

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
            scaleW = rNarestMult32(maxWidth);
            scaleH = rNarestMult32((maxWidth / iw) * ih);
            scaleRes = `${scaleW}:${scaleH}`
            resizeVF = `lavfi=[scale=${scaleRes}],`;
            cropScaleVF += resizeVF;
            console.log(`Automatic downscaling: ${srcRes}  ->   ${scaleRes}  `)
            check32(scaleW, scaleH);
        } else {
            scaleW = Math.round(maxWidth);
            scaleH = Math.round((maxWidth / iw) * ih);

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
    // const [numerator, denominator] = stream.r_frame_rate.split('/').map(Number);
    // let result;
    // if (!isNaN(numerator) && !isNaN(denominator)) {
    //     result = numerator * config.main.conf; // Replace OUTPUT_MULTIPLE with your desired multiple
    //     console.log("Output frame rate:", result);
    // } else {
    //     console.log("Invalid input frame rate format.");
    // }

    let vfarg = "--vf='" + cropScaleVF + "vapoursynth:[" + (fs.existsSync(scriptPath1) ? scriptPath1 : scriptPath2) + "]" + crop2VF + `,` + "'"; //:4:8
    // vfarg = "";
    console.log("vfarg ", vfarg);
    enc_args = 0 ? codec_hw_args : codec_sw_args;

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
    streamPath = recvVariables["stream_files_path"];
    return new Promise((resolve, reject) => {

        ffmpeg.ffprobe(file, function (err, metadata) {
            if (err) {
                console.error("FFprobe error ", err);
                reject(err);
            } else {
                try {
                    let stream = null;
                    for (var str of metadata.streams)
                        if (str.codec_type == "video")
                            stream = str;
                    if (stream) {
                        console.log("after check")
                        if (file == undefined) file = inputFile;
                        if (player != null) { player.command("quit"); console.log("\n---> quitting mpv <---\n") }
                        if (latestSSegmentInt)
                            clearInterval(latestSSegmentInt);
                        player = null;
                        let delcmd = "rm -f " + streamPath + "*";
                        //execSync(delcmd);

                        //console.log(metadata);


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
                    } else {
                        reject("file doesn't have video stream");
                    }
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
    streamPath = recvVariables["stream_files_path"];
    let segmentBufferN  = recvVariables["segment_buf_N"];
    assert(recvVariables["segment_buf_N"] != null);
    let playlistFile = streamPath + '/stream/out.m3u8';
    if (bIsRemotePaused.type !== "pauseQueued")
        fs.access(playlistFile, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('playlistFile does not exist');
            } else {
                fs.readFile(playlistFile, 'utf8', (err, data) => {
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
                        if (d > segmentBufferN) {

                            myWebSocket.sendWithResponse({ type: "perform_operation", operation_type: 'get_mpv_property', property_name: "pause" })
                                .then(res => {
                                    try {
                                        if (res.success) {
                                            let data = JSON.parse(res.data);
                                            if (!data) {
                                                console.log("---> pausing delta <--- \n")
                                                myWebSocket.sendWithResponse({
                                                    //type: "perform_operation", operation_type: 'post_mpv_command', command: ["set_property", "pause", "yes"]
                                                    type: "perform_operation", operation_type: 'pause_player', value: "yes"

                                                }).then(resMsg => { })
                                            }
                                        } else { console.log("error ", res.data); }
                                    } catch (error) { console.log("error ", error); }

                                })
                            // player.getProperty("pause")
                            //     .then((res) => {
                            //         if (!res) {
                            //             console.log("---> pausing delta <--- \n")
                            //             player.pause();
                            //         }
                            //     }).catch((e) => { console.log(e) });

                        }
                        else {
                            myWebSocket.sendWithResponse({ type: "perform_operation", operation_type: 'get_mpv_property', property_name: "pause" })
                                .then(res => {
                                    try {
                                        if (res.success) {
                                            let data = JSON.parse(res.data);
                                            if (data) {
                                                console.log("---> resuming delta <--- \n")
                                                myWebSocket.sendWithResponse({
                                                    //  type: "perform_operation", operation_type: 'post_mpv_command', command: ["set_property", "pause", "no"]
                                                    type: "perform_operation", operation_type: 'pause_player', value: "no"
                                                }).then(resMsg => { })
                                            }
                                        } else { console.log("error ", res.data); }
                                    } catch (error) { console.log("error ", error); }

                                })
                            // player.getProperty("pause")
                            //     .then((res) => {
                            //         if (res) {
                            //             console.log("---> resuming delta <--- \n")
                            //             player.resume();
                            //         }
                            //     }).catch((e) => { console.log(e) });

                        }
                    }
                });
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
//app.use(express.static(__dirname + '/public'));


let unzipit =fs.existsSync(`${__dirname}/data.bin`), zip, zipEntries, specificEntry;
if (unzipit){
    const zipData = fs.readFileSync(`${__dirname}/data.bin`);
    zip = new AdmZip(zipData);
    zipEntries = zip.getEntries();
    }
let dict = {"/": "client.html", "/style": "style.css", "/clientjs": "client.js" , "/client_utils": "client_utils.js", "/remote": "remote.html", "/remotejs": "remote.js" }
let dict2 = ["client.html",  "style.css",  "client.js" ,  "client_utils.js",  "remote.html",  "remote.js" ]
console.log( process.env.APPDATA)
async function getFileData(req, res){
    const endp =  dict[req.url];
    if (zipEntries)
        specificEntry   = zipEntries.find(entry => entry.entryName === endp);
    if (specificEntry) {
        console.log("z" +req.url)
        let file = `${process.env.APPDATA}/Rife Player/temp/${endp}`
        ret = zip.extractEntryTo(endp, `${process.env.APPDATA}/Rife Player/temp`, false, true);
        res.status(200).sendFile(file, (err) => {
            if (err) {}// console.error('Error sending file:', err);
            else {
                fs.unlink(file, (err) => {
                    if (err) {} //  console.error('Error deleting file:', err);
                });
            }
        });
    }
    else{
        console.log("-" + req.url)
        res.status(200).sendFile( `${__dirname}/${endp}`);
    }

        // let data = specificEntry.getData().toString('utf8');
        // if (data){        
        //     console.log("z" +req.url)
        //     res.status(200).send(data);
        // }
    // fs.access(`${__dirname}/${ccc}.bin`, fs.constants.F_OK, (err) => {
    //     let file = `${__dirname}/${err ? endp : ccc+".bin"}`
    //         res.status(200).sendFile(file);
    //         console.log((err ? "/" : "bin/")+ endp)
    // });

}

app.get('/', (req, res) => {
    return getFileData(req, res)
});
app.get('/style', (req, res) => {
    return getFileData(req, res)
});
app.get('/clientjs', (req, res)  => {
    return getFileData(req, res)
    //return res.status(200).sendFile(`${__dirname}/client.js`);
});
app.get('/client_utils', (req, res) => {
    return getFileData(req, res)
});
app.get('/remote', (req, res) => {
    return getFileData(req, res)
});
app.get('/remotejs', (req, res) => {
    return getFileData(req, res)
});

app.get('/files', (req, res) => {
    //config = readINI(configFile);
    const subfolder = req.query.subfolder || ''; // Get subfolder path from query parameter
    const netfolder = recvVariables["network_folder"];
    if (netfolder) {
        const directoryPath2 = path.join(netfolder, subfolder);

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
                        //console.error('Error getting file stats:', err);
                        // res.status(500).send('Internal Server Error');
                        // return;
                    } else {

                        const fileInfo = {
                            name: file,
                            type: stats.isDirectory() ? 'folder' : 'file',
                            absPath: path.join(subfolder, file)
                        };
                        filesWithInfo.push(fileInfo);
                    }
                    count++;
                    if (count === files.length) {
                        res.json(filesWithInfo);
                    }
                });
            });
        });
    }
    else
        res.json({error: "null network folder"});

});

function checkFile(filePath, callback) {
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            setTimeout(() => {
                checkFile(filePath, callback);
            }, 1000); // wait for 1 second before checking again (adjust the time as needed)
        } else {
            callback();
        }
    });
}



function checkFile2(filePath, intervalTime = 1000, timeout = Infinity) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        function check() {
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (!err) {
                    resolve(filePath);
                } else {
                    const elapsedTime = Date.now() - startTime;

                    // Check if the timeout has been reached
                    if (elapsedTime >= timeout) {
                        reject(new Error(`Timeout reached for file: ${filePath}`));
                    } else {
                        // File doesn't exist yet, wait for a while and check again
                        setTimeout(check, intervalTime);
                    }
                }
            });
        }
        check(); // Start the initial check
    });
}


app.get('/mpv-play-file', (req, res) => {

    //config = readINI(configFile);
    const file = req.query.file || ''; // Get subfolder path from query parameter
    const useTCP = req.query.useTCP == "true" // Get subfolder path from query parameter
    let streamPath = recvVariables["stream_files_path"];
    latestSSegment = 0;
    latestCSegment = 0;
    const file_path = path.join(recvVariables["network_folder"], file);
    console.log('\n ---> Requested file:', file_path, " ; useTCP ", useTCP, " <---\n");
    if (fs.existsSync(file_path)) {

        //myWebSocket.socket.send(JSON.stringify({ type: "perform_operation", operation_type: 'open_file', file_path: file_path }));
        const requestId = myWebSocket.sendWithResponse({ type: "perform_operation", operation_type: 'open_file', file_path: file_path })
            .then(innerResult => {
                console.log(`file opened ok: ${innerResult}`);
                checkFile(streamPath + "\\stream\\str000001.ts", () => {
                    console.log(`File ${streamPath + "\\stream\\str000001.ts"} exists.`);
                    //res.json({ trackList: null, message: ".ts files found  " });
                    checkFile(streamPath + "\\stream\\out.m3u8", () => {
                        console.log(`File ${streamPath + "\\stream\\out.m3u8"} exists.`);
                        if (latestSSegmentInt)
                            clearInterval(latestSSegmentInt);
                        latestSSegmentInt = setInterval(getLatestHLSSegmentF, 2000);

                        myWebSocket.sendWithResponse({ type: "perform_operation", operation_type: 'get_mpv_property', property_name: "track-list"  })
                            .then(tr => {
                                let data = JSON.parse(tr.data);
                                res.json({ trackList: data, message: ".ts files found  " });

                            })

                    })
                })


                // let ret = startMpv(file_path);
                // ret.then(() => {
                // console.log("\n---> startMPV then", ret, " <--- \n");

                // checkIfDirectoryEmpty(streamPath)
                //     .then(() => {
                //console.log('\n -->Stream files deleted, proceeding..  <-- \n');


                // player.getProperty('track-list').then(tr => {
                //     console.log("\n --> Got file track-list <-- \n");
                //     res.json({ trackList: tr, message: "success getting tack list " });
                //     //if (usetimerPauser) timedPaused();
                // }).catch((error) => {
                //     console.log(error);
                //     res.status(500).json({ error: "Error gettin track" });

                // })

                //res.json({ message: 'File exists, opening...' });
            }).catch(innerError => {
                console.log(`not ok: ${innerError}`);
            });        //
    // })
        // .catch((err) => {
        //     console.error('\n --> Error checking directory:  <-- \n', err);
        //     res.status(500).json({ error: { message: 'Failed to check directory' } });

        // });
        //setTimeout(() => {
        // }, 1000);
        // }).catch((err) => {

        //     console.error('\n --> Error opening file:  <-- \n', err);
        //     res.status(500).json({ error: { message: 'Failed to open file' } });
        // });

    } else {
        res.status(500).json({ error: { message: "\n -->  File doesn't exist" } });
    }
    console.log(`End fun}`);

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

        //    if (player) {
        if (req.body.reqtype == "cycle") {

            myWebSocket.sendWithResponse({ type: "perform_operation", operation_type: 'post_mpv_command', command: ["cycle", req.body.which] })
                .then(mpvres => {
                    if (!mpvres.success) {
                        res.json({success: false, error: 'Internal Server Error' + mpvres.data });
                    }
                    else {
                        let data = JSON.parse(mpvres.data);
                        myWebSocket.sendWithResponse({ type: "perform_operation", operation_type: 'get_mpv_property', property_name: `current-tracks/${req.body.which}` })
                            .then(mpvres => {
                                res.json({success: true, reqRes: JSON.parse(mpvres.data) });
                            })
                    }
                })

            // player.command("cycle", req.body.which).then(sub => {
            //     player.getProperty(`current-tracks/${req.body.which}`).then(mpvres => {
            //         res.json({ reqRes: mpvres });
            //     }).catch(
            //         (error) => { console.log(error); res.json({ reqRes: { title: "None" } }); })
            // }).catch((error) => { console.log(error); res.json({ reqRes: { title: "Cycle failed" } }); })

        } else {
            myWebSocket.sendWithResponse({ type: "perform_operation", operation_type: 'get_mpv_property', property_name: `current-tracks/${req.body.which}` })
                .then(mpvres => {
                    if (!mpvres.success) {
                        res.json({success: false, error: 'Internal Server Error' + mpvres.data });
                    }
                    else {
                    res.json({ success: true, reqRes: JSON.parse(  mpvres.data) });
                    }
                })

            // player.getProperty(`current-tracks/${req.body.which}`).then(mpvres => {
            //     res.json({ reqRes: mpvres });
            // }).catch(
            //     (error) => { console.log(error); res.json({ reqRes: { title: "None" } }); })
        }

        // } else
        //     res.json({ reqRes: { title: "No file playing" } });


    } catch (error) {
        console.error('Error  occurred:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/mpv-seek', (req, res) => {
    respondedIPs.clear()

    const sliderValue = req.body.sliderValue;
    if (1) {
        myWebSocket.sendWithResponse({ type: "perform_operation", operation_type: 'player_seek', sliderValue: sliderValue })
            .then(response => {
                console.log("response", response)
                res.send(response)
                    //              duration = parseFloat(durationMsg.data);
                //                let newPos = (sliderValue / 1000) * duration;

                // console.log('Slider Value:', sliderValue, " Seek pos: ", newPos, " Dur: ", duration);

                // myWebSocket.sendWithResponse({
                //     type: "perform_operation",
                //     operation_type: 'post_mpv_command',
                //     command: ["set_property", "playback-time", newPos]
                // })
                //     .then(resMsg => {
                //         //let data = JSON.parse(message.data);
                //         res.json({ message: { 'Seek result': resMsg } });
                //         myWebSocket.sendWithResponse({
                //             type: "perform_operation", operation_type: 'post_mpv_command', command: ["set_property", "pause", "no"]
                //         }).then(resMsg => { })
                //     })

            })
    } else

        myWebSocket.sendWithResponse({ type: "perform_operation", operation_type: 'get_mpv_property', property_name: "duration" })
            .then(durationMsg => {
                duration = parseFloat(durationMsg.data);
                let newPos = (sliderValue / 1000) * duration;
                console.log('Slider Value:', sliderValue, " Seek pos: ", newPos, " Dur: ", duration);

                myWebSocket.sendWithResponse({
                    type: "perform_operation",
                    operation_type: 'post_mpv_command',
                    command: ["set_property", "playback-time", newPos]
                })
                    .then(resMsg => {
                        //let data = JSON.parse(message.data);
                        res.json({ message: { 'Seek result': resMsg } });
                        myWebSocket.sendWithResponse({
                            type: "perform_operation", operation_type: 'post_mpv_command', command: ["set_property", "pause", "no"]
                        }).then(resMsg => { })
                    })

            })


    // //clientPos = 0;
    // player.getDuration()
    //     .then((duration) => {

    //         let newPos = (sliderValue / 1000) * duration;
    //         console.log('Slider Value:', sliderValue, " Seek pos: ", newPos, " Dur: ", duration);
    //         player.seek(newPos, 'absolute');
    //         //    if (usetimerPauser) timedPaused();
    //     })
    //     .catch((error) => { console.log(error); })

    // res.json({ message: 'Slider value received successfully.' });
});

const respondedIPs = new Set();
function millis() { return new Date().getTime()}
app.post('/mpv-get-perc-pos', (req, res) => {

    if (1) {
        if (responseCaches.has("get_duration_and_pos")){
            let obj =  responseCaches.get("get_duration_and_pos");
            if (millis() - obj.time  < 4000){
                 res.send(obj.cachedMsg)
                 console.log("Sending cached");
                 return;
            }
        }
        myWebSocket.sendWithResponse({ type: "perform_operation", operation_type: 'get_duration_and_pos' }, false)
            .then(ret => {
                let resMsg;
                if (ret.success){
                   // console.log("res", ret)
                    let msg = ret.message;
                    let sliderPos  = 0;
                    if (msg.data){
                        let  pos =  parseFloat(msg.data.video_curTime)
                        let duration = parseFloat(msg.data.video_duration)
                        sliderPos = (pos / duration) * 1000;
                        console.log('Server pos', pos.toFixed(2), " slider pos: ", sliderPos.toFixed(2), " Dur: ", duration);
                    }
                    //const clientIP = req.ip || req.connection.remoteAddress;
                    let outRemPause = bIsRemotePaused;
                    // if (respondedIPs.has(clientIP) && bIsRemotePaused.type == "queueSeekToEnd")
                    //     outRemPause.type = "noAction";
                    resMsg = { number: sliderPos, player_status: "RUNNING", play_session_id: msg.play_session_id, mirroring_mode: msg.mirroring_mode, is_remote_paused : outRemPause, debug_mode: msg.debug_mode }
                    // if (bIsRemotePaused.type == "queueSeekToEnd")
                    //     respondedIPs.add(clientIP);
                }
                else 
                    resMsg = { number: -1, player_status: "STOPPED", play_session_id: null, mirroring_mode: null, is_remote_paused : "noAction",  debug_mode:  false  }
                responseCaches.set("get_duration_and_pos", {cachedMsg: resMsg, time: millis()});
                res.send(resMsg);


            })
    }
    else
        myWebSocket.sendWithResponse({ type: "perform_operation", operation_type: 'get_mpv_property', property_name: "duration", is_remote_paused : noAction })
            .then(durationMsg => {
                if (durationMsg) {
                    if (durationMsg.success == false) {
                        res.send({ number: -1 });
                    } else
                        myWebSocket.sendWithResponse({ type: "perform_operation", operation_type: 'get_mpv_property', property_name: "playback-time" })
                            .then(posMsg => {
                                if (posMsg != null) {
                                    //let data = JSON.parse(message.data);
                                    duration = parseFloat(durationMsg.data);
                                    pos = parseFloat(posMsg.data);
                                    let sliderPos = (pos / duration) * 1000;
                                    console.log('Server pos', pos.toFixed(2), " slider pos: ", sliderPos.toFixed(2), " Dur: ", duration);
                                    res.send({ number: sliderPos });
                                } else res.send({ number: -1 });
                            })
                } else res.send({ number: 0 });
            })

// const clientPlaybackD = req.body.clientPlaybackD;
    // if (player)
    //     player.getDuration()
    //         .then((duration) => {
    //             player.getProperty('playback-time').then(pos => {
    //                 let sliderPos = (pos / duration) * 1000;
    //                 //let delta = clientPlaybackD;
    //                 //console.log('Server pos', pos.toFixed(2), " delta  ", delta.toFixed(2), " slider pos: ", sliderPos.toFixed(2), " Dur: ", duration);
    //                 console.log('Server pos', pos.toFixed(2), " slider pos: ", sliderPos.toFixed(2), " Dur: ", duration);
    //                 //if (clientPos)
    //                 // if (delta > config.main.segmentTime * config.main.pausePlayTimeMult) {
    //                 //     player.getProperty("pause")
    //                 //         .then((res) => {
    //                 //             if (!res) {
    //                 //                 console.log("---> pausing delta <--- \n")
    //                 //                 player.pause();
    //                 //             }
    //                 //         }).catch((e) => { console.log(e) });
    //                 // }
    //                 // else {
    //                 //     player.getProperty("pause")
    //                 //         .then((res) => {
    //                 //             if (res) {
    //                 //                 console.log("---> resuming delta <--- \n")
    //                 //                 player.resume();
    //                 //             }
    //                 //         }).catch((e) => { console.log(e) });
    //                 // }
    //                 res.send({ number: sliderPos });
    //             }).catch((error) => { console.log(error); })
    //         }).catch((error) => { console.log(error); })
    
});


app.post('/remote-pause', (req, res) => {

    const postData = req.body;
    console.log("remote pause ", req.body)
    bIsRemotePaused =  {type: postData.newState, id: generateUniqueId()}; 
   // if (bIsRemotePaused != "queueSeekToEnd")
        respondedIPs.clear()

    myWebSocket.sendWithResponse({
        type: "perform_operation", operation_type: 'pause_player', value: bIsRemotePaused.type === "pauseQueued" ?  "yes" : "no"
    }).then(resMsg => {
        // if (resMsg.success)     bIsRemotePaused = postData.newState;
        res.send({ message: "vars updated",  is_remote_paused : bIsRemotePaused, success: resMsg.success });

     })
});


app.post('/short-seek', (req, res) => {

    const postData = req.body;
    console.log("short seek ", req.body)   
    //respondedIPs.clear()
    bIsRemotePaused = {type: postData.b_forward ? "queueSkipFwd" : "queueSkipBack", id: generateUniqueId()};
    res.send({ message: "short seek response",  success: true });
    // myWebSocket.sendWithResponse({
    //     type: "perform_operation", operation_type: 'short_seek', b_forward: postData.b_forward
    // }).then(resMsg => {
    //     res.send({ message: "short seek response",  success: resMsg.success });
    //     bIsRemotePaused = "queueSeekToEnd";
    // })
    
});



app.get('/mpv-is-player', (req, res) => {
    //myWebSocket.socket.send(JSON.stringify({ type: "perform_operation", operation_type: 'open_file', file_path: file_path }));
    if (myWebSocket.socket.readyState === WebSocket.OPEN) {

        myWebSocket.sendWithResponse({ type: "get_player_status" })
            .then(messageData => {
                // if (messageData && messageData.player_status == "STARTING" || messageData && messageData.player_status == "RUNNING")
                //     res.send({ number: 1 });
                // else

                res.send(messageData);

                console.log(`mpv-is-player: ${messageData}`);
            })
            .catch(err => {
                console.log(`Error checking mpv-is-player: ${err}`);
                res.send({ number: 0, message: "error", error: err });
            });
    }else{
        res.send({ number: 0, message: "No connection to host player", error: null });

    }

// if (player == null)
//     res.send({ number: 0 });
// else {
//     player.getDuration()
//         .then((duration) => {
//             player.getProperty('playback-time').then(pos => {
//                 res.send({ number: 1 });
//             }).catch((error) => { res.send({ number: 0 }); })
//         }).catch((error) => { res.send({ number: 0 }) })
// }
});

// app.use(express.static('videos'));

// // Define a route to handle video file requests
// app.get('/s/:videoName', (req, res) => {
//   const videoName = req.params.videoName;
//   const videoPath = path.join(__dirname, 'public', videoName);
//   res.sendFile(videoPath);
// });

// Start the Express server

// let server = http.listen(config.main.port, inColab ? "127.0.0.1" : HOST, () => {
//         console.log(`Server is listening at http://${HOST}:${config.main.port}`);

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

// const getLocalIpAddress = () => {
//     const interfaces = os.networkInterfaces();
//     let ipAddress = '';
//     Object.keys(interfaces).forEach((interfaceName) => {
//       const interfaceInfo = interfaces[interfaceName];
//       for (const info of interfaceInfo) {
//         if (!info.internal && info.family === 'IPv4') {
//           ipAddress = info.address;
//           break;
//         }
//       }
//     });
//     return ipAddress;
//   };


let server = app.listen(PORT,  () => {
    const networkInterfaces = os.networkInterfaces();
    const ipv4Addresses = networkInterfaces['Ethernet'] || networkInterfaces['Wi-Fi'] || [];
    const ipAddress = ipv4Addresses.find(interface => interface.family === 'IPv4');
    HOST = ipAddress.address;
    console.log(`Server is running at http://${HOST}:${PORT}/`);

    // if (inColab) {
    //     const ngrok = require('ngrok');
    //     (async function () {
    //         const url = await ngrok.connect(PORT);
    //         console.log(`Server is accessible from the internet at: ${url}`);
    //     })();
    // }
});
function waitForNotNull(variable) {
    return new Promise(resolve => {
        if (variable !== null) {
            resolve(variable);
        } else {
            const interval = setInterval(() => {
                if (variable !== null) {
                    clearInterval(interval);
                    resolve(variable);
                }
            }, 100); // Check every 100 milliseconds
        }
    });
}

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
                //console.log("numer ", number, " latestCSegment ", latestCSegment, "numberS", numberS);
                if (number > latestCSegment) {
                    latestCSegment = Math.min(latestSSegment, number);
                    last = true;
                }
            }

            console.log("GET received: " + req.url + (last ? "*" : ""))

            waitForNotNull(streamPath)
                .then(value => {
                    let filePath = path.join(streamPath, req.url);

                    fs.access(filePath, fs.constants.F_OK, function (err) {
                        if (err) {
                            console.log('File not exist');

                            checkFile2(filePath, 500, Infinity)
                                .then((filePath) => {
                                    console.log(`File ${filePath} exists now.`);
                                    cb(null, true);
                                })
                                .catch((error) => {
                                    console.error(error.message);
                                    return cb(null, false);
                                });

                        } else
                            cb(null, true, null);
                    });
                });


        },
        getManifestStream: (req, cb) => {
            let filePath = path.join(streamPath, req.url ) ;
            const stream = fs.createReadStream(filePath);
            cb(null, stream, {name: "bIsRemotePaused", value: JSON.stringify(bIsRemotePaused)});
        },
        getSegmentStream: (req, cb) => {
            let filePath = path.join(streamPath, req.url ) ;
            const stream = fs.createReadStream(filePath);
            cb(null, stream, {name: "bIsRemotePaused", value: JSON.stringify(bIsRemotePaused)});
        }
    }
});


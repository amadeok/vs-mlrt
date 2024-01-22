
const playBtn = document.getElementById('playButton');
const pauseBtn = document.getElementById('pauseButton');

const stepFwdBtn = document.getElementById('stepFwdBtn');
const stepBackBtn = document.getElementById('stepBackBtn');

const fileListElem = document.getElementById('file-list');
const toggleButton = document.getElementById('toggle-button');

const subtitleNameField = document.getElementById('subtitle-name');
const subCycleBtn = document.getElementById("subtitle-cycle-button");
const audioNameField = document.getElementById('audio-track-name');
const audioCycleBtn = document.getElementById("audio-cycle-button");

const sliderValueDisplay = document.getElementById('slider-value');

let debounceTimeout = null;
let bSeeking = false;
let playInterval = null;
let mirroringMode = null;
let playSessionId = null;
let playerStatus = null;
let first = false;
let requestingFile = false;
let isTherePlayer = false;
let bIsRemotePaused = "noAction";

const trackReq = { sub: 0, audio: 1, cycle: 2, getCurrent: 3 }
const remotePauseEnum = { pauseQueued: 1, playQueued: 2, noAction: 0 }

async function trackReqFun(which, reqtype, index) {
    let field = which == "sub" ? subtitleNameField : audioNameField;
    try {
        const response = await fetch('/mpv-track-req', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ which: which, reqtype: reqtype, index: index }),
        });
        const data = await response.json();
        console.log(data);
        field.innerText = data.reqRes.title ? data.reqRes.title : data.reqRes.lang;

    } catch (error) {
        console.error('Error:', error);
        field.innerText = 'Error occurred. Please try again.';
    }
}


function handleSeekBarInput()  {
    // Clear the previous debounce timeout
    if (bSeeking) return;
    clearTimeout(debounceTimeout);
    
    bSeeking = true;
    console.log("Range input clicked!!!", bSeeking);
    // Set a new debounce timeout
    debounceTimeout = setTimeout(() => {
        const sliderValue = seekSlider.value;
        //sliderValueDisplay.textContent = `Slider Value: ${sliderValue}`;

        // Make a POST request to the server
        fetch('/mpv-seek', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sliderValue: sliderValue }),
        })
            .then(response => response.json())
            .then(data => {
                // Handle the response from the server if needed
                console.log('Server response:', data);
            })
            .catch(error => {
                console.error('Error:', error);
            }).finally(() => {
                if (typeof videoElement !== 'undefined')
                    videoElement.currentTime = videoElement.duration;
                else
                    remotePause("queueSeekToEnd");

            });
    }, 100); // Debounce time in milliseconds (e.g., 300ms)
}

let seekOnEndCount = 0;
async function procVars(data){
    //const data = await response.json();
    let lastplaySessionId = localStorage.getItem('play_session_id');
    localStorage.setItem('prev_play_session_id', lastplaySessionId);
    localStorage.setItem('play_session_id', data.play_session_id);
    playSessionId =  data.play_session_id;

    let lastStatus = localStorage.getItem('play_status');
    localStorage.setItem('prev_play_status', lastplaySessionId);
    localStorage.setItem('play_status', data.player_status);
    playerStatus =  data.player_status;
    console.log("Status: ", data.player_status,  "rem paused",  data.is_remote_paused);

    if (data.player_status == "RUNNING") {
        console.log(" mirroring mode: ", data.mirroring_mode, " play session id", data.play_session_id);
        if ( lastplaySessionId != playSessionId) {
            alert("New play session");
            location.reload();
        }
    }
    else if (lastStatus != playerStatus){
        if (typeof videoElement !== 'undefined') 
            videoElement.pause();
        showFileBrowser();
        alert("Player has stopped")
        console.log("Not running");
    }
    bIsRemotePaused = data.is_remote_paused;
    if (typeof videoElement !== 'undefined' ) {
        if (bIsRemotePaused === "pauseQueued"){
            videoElement.pause();
            bIsRemotePaused = "noAction";
            seekOnEndCount = 0;
        }
        else if (bIsRemotePaused === "playQueued"){
            videoElement.play();
            bIsRemotePaused = "noAction";
            seekOnEndCount = 0;
        }
        else if  (bIsRemotePaused ===  "queueSeekToEnd"  ){
            if (typeof videoElement !== 'undefined' && seekOnEndCount == 0) {
                videoElement.currentTime = videoElement.duration;
                console.log("Seeking to end")
            }
            bIsRemotePaused = "noAction";
            seekOnEndCount+=1;
        }else seekOnEndCount = 0;
    }
        
    mirroringMode = data.mirroring_mode;
    //playSessionId =  data.play_session_id;
    //localStorage.setItem('play_session_id', data.play_session_id);

    seekSlider.value = data.number;
}
async function makeRequest() {
    try {
        //console.log("mreq ", bSeeking, hls.levels[hls.currentLevel] , hls.levels[hls.currentLevel].details)
        if (!bSeeking) {
           // if (hls.levels[hls.currentLevel] && hls.levels[hls.currentLevel].details) {
                // let frags = hls.levels[hls.currentLevel].details.fragments;
                // let last = frags[frags.length - 1];
                // let d = last.start - currentSegmentStartTime;
                const response = await fetch('/mpv-get-perc-pos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ clientPlaybackD: null }),
                });
                await procVars( await response.json());
                               
           // }
        }
        else console.log("seeking, get perc pos aborted")
    } catch (error) {
        console.error('Error:', error);
    }
}



function getParentDirectory(path) {
    const directories = path.split('/');
    directories.pop();
    const parentDirectory = directories.join('/');
    return parentDirectory;
}


async function getListOfFiles(subfolder) {
    try {
        const response = await fetch(`/files?subfolder=${subfolder}`);
        if (response.ok) {
            const files = await response.json();
            if (files.error && files.error  == "null network folder")
                alert("The Rife Player app doesn't appear to be running, launch it, then reload the page");
            return files;
        } else {
            console.error('Error retrieving files:', response.statusText);
            return {};
        }
    } catch (error) {
        console.error('Error:', error);
        return {};
    }
}

function isPlayerRunning() {
    return new Promise((resolve, reject) => {
        fetch('/mpv-is-player')
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Error checking player: ' + response.statusText);
            })
            .then(res => {
                //console.log("Player running: ", res);
                resolve(res);
            })
            .catch(error => {
                console.error('Error:', error);
                reject(0);
            });
    });
}


function createListElement(name, type, absPath, fileListElem) {
    const listItem = document.createElement('li');
    listItem.className = 'file-list-item';
    const link = document.createElement('a');
    link.href = '#'; // You can set the actual file path here
    link.textContent = name;
    listItem.setAttribute('ftype', type);
    listItem.setAttribute('absPath', absPath);
    if (type == "folder")
        link.id = type + folder_index;
    else
        link.id = type + file_index;

    listItem.appendChild(link);
    // // Add a separator (hr element) between each list item except the last one
    // if (index < files.length - 1) {
    //     listItem.appendChild(document.createElement('hr'));
    // }
    fileListElem.appendChild(listItem);
    document.getElementById(link.id).onclick = function () {
        // Your JavaScript code here
        console.log("Link clicked! ", link.textContent);
        absPath = listItem.getAttribute('absPath', absPath);
        let type = listItem.getAttribute('ftype');
        if (type == "folder") {
            console.log("browser file update")
            updateFilebrowser(absPath);
        }
        else if (type == "upFolder") {
            console.log("browser file update up folder")
            updateFilebrowser(absPath);
        } else if (type == "file") {
            if (requestingFile)
                alert("Please wait, requesting file");
            else {
                console.log("play file ")

                requestingFile = true;
                ret = fetch(`/mpv-play-file?file=${absPath}`) //&useTCP=${TCPCheckbox.checked}
                // const response = fetch("/mpv-play-file", {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify({ absPath: absPath, S: reqtype, index: index }),
                // });
                ret
                    .then(response => {
                        let res = response.body.error;
                        console.log(" response ", res);

                        if (!response.ok) {
                            return response.json().then((errorData) => {
                                throw new Error(errorData.error.message);
                            });
                        }
                        return response.json().then((data) => {
                            return data;
                        });
                    })
                    .then((data) => {
                        console.log("Then success")
                        if (typeof hls !== 'undefined') {
                            clearInterval(playInterval);
                            if (hls) {
                                hls.destroy();
                            }
                            video.pause();
                            startPlayEv();

                            console.log('Play file server response:', data.trackList, " error ", data.error);
                        }
                    })
                    .catch((error) => {
                        console.error('Error:', error.message);
                        alert(error.message);

                    })
                    .finally(() => { requestingFile = false; });
            }
        }
        // Prevent the default behavior of the link (e.g., navigating to a different page)
        return false;
    };



}

function renderFileList(files, subfolder) {
    fileListElem.innerHTML = '';
    file_index = 0;
    folder_index = 0;
    if (!subfolder == '')
        createListElement("... Previous folder", "upFolder", getParentDirectory(subfolder), fileListElem);

    files.forEach((file, index) => {
        createListElement(file.name, file.type, file.absPath, fileListElem);
        if (file.type == "folder")
            folder_index++;
        else
            file_index++;
    });
}

function updateFilebrowser(subfolder) {
    let files;
    let filesProm = getListOfFiles(subfolder);
    filesProm
        .then((files_) => {
            files = files_;
            console.log("files", files)
            if (files.length)
                renderFileList(files, subfolder);
            
        })
        .catch((error) => { console.log(error); })
}

function showFileBrowser() {
    let isVideo = false;
    if (typeof videoElement !== 'undefined') 
        isVideo = true;
    console.log(isVideo ? "Showing " : "Hiding ", "file browser");

    fileListElem.style.display = 'block';
    if (isVideo)
        videoElement.style.display = 'none';
    toggleButton.textContent = 'Hide file browser';
}

async function playPauseFun () {
    try {
        const response = await fetch('/mpv-pause-cycle', {
            method: 'POST',
        });
        const data = await response.json();
        document.getElementById('result').innerText = data.message;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('result').innerText = 'Error occurred. Please try again.';
    }
    //togglePlayPause();
}

async function remotePause (newState_) {
    console.log("Remote pause new state : ", newState_);
    try {
        const response = await fetch('/remote-pause', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({ newState: newState_}),
        });
        const data = await response.json();
        console.log("rem pause data", data)
        document.getElementById('result').innerText = data.message;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('result').innerText = 'Error occurred. Please try again.';
    }
    //togglePlayPause();
}
async function shortSeek (bForward) {
    console.log("Short seek : ", bForward);
    try {
        const response = await fetch('/short-seek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({ b_forward: bForward}),
        });
        const data = await response.json();
        console.log("Short seek response", data)
        document.getElementById('result').innerText = data.message;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('result').innerText = 'Error occurred. Please try again.';
    }
    //togglePlayPause();
}



document.addEventListener('DOMContentLoaded', function () {
    seekSlider.addEventListener('input', handleSeekBarInput);
    seekSlider.addEventListener('mouseup', () =>  {console.log("released table input "); bSeeking = false;});
    seekSlider.addEventListener('touchend',() =>  {console.log("released table input "); bSeeking = false;});
    
});

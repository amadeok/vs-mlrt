
const playPauseBtn = document.getElementById('triggerButton');
const fileListElem = document.getElementById('file-list');
const videoElement = document.getElementById('video');
const toggleButton = document.getElementById('toggle-button');
var currentSegmentStartTime = 0;
let hls = null;
let playInterval = null;

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
                console.log("Player running: ", res.number);
                resolve(res.number);
            })
            .catch(error => {
                console.error('Error:', error);
                reject(0);
            });
    });
}

const TCPCheckbox = document.getElementById('tcp-checkbox');
let requestingFile = false;
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
                response = fetch(`/mpv-play-file?file=${absPath}&useTCP=${TCPCheckbox.checked}`)
                // const response = fetch("/mpv-play-file", {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify({ absPath: absPath, S: reqtype, index: index }),
                // });
                response
                    .then(response => response.json())
                    .then(data => {
                        if (!TCPCheckbox.checked) {
                            clearInterval(playInterval);
                            if (hls) {
                                hls.destroy();
                            }
                            video.pause();
                            startPlayEv();
                        }
                        console.log('Play file server response:', data.trackList);
                    })
                    .catch(error => { console.error('Error:', error); })
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
            renderFileList(files, subfolder);
        })
        .catch((error) => { console.log(error); })
}

function showFileBrowser() {
    console.log("Showing player");
    fileListElem.style.display = 'block';
    videoElement.style.display = 'none';
    toggleButton.textContent = 'Show Video';
}
function showPlayer() {
    console.log("Showing file browser")
    fileListElem.style.display = 'none';
    videoElement.style.display = 'block';
    toggleButton.textContent = 'Show File Browser';
}
function startHls() {
    console.log("Starting hls")
    const videoSrc = '/stream/out.m3u8';

    if (Hls.isSupported()) {
        hls = new Hls({
            //startLevel: -1, // Start playback with the lowest available quality
            enableWorker: true, // Enable the worker for improved performance );
            backBufferLength: 0, // Set the back buffer length in seconds
        });

        hls.loadSource(videoSrc);
        hls.attachMedia(videoElement);
        ///hls.config.backBufferLength = 0; // Set the back buffer length in seconds
        hls.on(Hls.Events.FRAG_CHANGED, function (event, data) {
            //  var currentFrag = hls.levels[hls.currentLevel].details.fragments[data.frag.cc];
            currentSegmentStartTime = data.frag.start;
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoElement.play();
        });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = videoSrc;
        videoElement.addEventListener('loadedmetadata', () => {
            videoElement.play();
        });
    }
}
function startPlayEv() {
    playInterval = setInterval(makeRequest, 4000);
    setTimeout(() => {
        startHls();
        console.log("video play");
        trackReqFun("sub", "cur", null);
        trackReqFun("audio", "cur", null);
    }, 1000);
    showPlayer();
}

let isTherePlayer;
document.addEventListener('DOMContentLoaded', function () {

    isPlayerRunning()
        .then(result => {
            isTherePlayer = result;
            if (isTherePlayer) {
                startPlayEv();
            }
            else
                showFileBrowser();
            console.log('Player status:', isTherePlayer);
        }).catch(error => { console.error('Error:', error); });

    // if (videoElement.paused) {
    //     playPauseBtn.textContent = "Pause";
    // } else {
    //     playPauseBtn.textContent = "Play ";
    // }

    updateFilebrowser('')

    function toggleElements() {
        if (fileListElem.style.display === 'none') {
            videoElement.pause();
            showFileBrowser();
        } else {
            showPlayer();
        }
    }

    toggleButton.addEventListener('click', toggleElements);

});
const trackReq = { sub: 0, audio: 1, cycle: 2, getCurrent: 3 }

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

const subtitleNameField = document.getElementById('subtitle-name');
const subCycleBtn = document.getElementById("subtitle-cycle-button");
const audioNameField = document.getElementById('audio-track-name');
const audioCycleBtn = document.getElementById("audio-cycle-button");

subCycleBtn.addEventListener('click', async () => {
    trackReqFun("sub", "cycle", null);
});

audioCycleBtn.addEventListener('click', async () => {
    trackReqFun("audio", "cycle", null);

});
const seekSlider = document.getElementById('seek-slider');
const sliderValueDisplay = document.getElementById('slider-value');
let debounceTimeout;
let bSeeking = false;

// videoElement .onwaiting = function() {
//     console.log("Video is buffering");
// };

videoElement.onplaying = function () {
    console.log("Video is no longer buffering and is playing");
    if (bSeeking) {
        videoElement.currentTime = videoElement.duration;
        bSeeking = false;
    }
};


videoElement.addEventListener('seeking', function () {
    // Calculate the target seek position with low latency
    console.log("seeking list")
    //  var targetSeekTime = videoElement.duration; // Seek forward by 5 seconds (you can adjust this value)

    // Perform the seek operation
    // if (hls.media) {
    //     // Round the seek time to the nearest segment boundary for better accuracy
    //     var nearestSegmentIndex = hls.media.segments.findSegmentIndex(targetSeekTime);
    //     if (nearestSegmentIndex !== null) {
    //         var nearestSegment = hls.media.segments.getSegment(nearestSegmentIndex);
    //         var seekTime = nearestSegment.start;

    //         // Perform the seek operation
    //         video.currentTime = seekTime;
    //     }
    // }
});

seekSlider.addEventListener('input', function () {
    // Clear the previous debounce timeout
    clearTimeout(debounceTimeout);

    bSeeking = true;
    console.log("Range input clicked!", bSeeking);
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
                videoElement.currentTime = videoElement.duration;

                // if (hls)
                //     hls.destroy()
                // startHls();

                // let counter = 0; // Counter to keep track of the number of times the interval has run
                // const intervalId = setInterval(() => {
                //     counter++;
                //     videoElement.currentTime = videoElement.duration;
                //     console.log("seek to end timeout ", counter);
                //     if (counter >= 2) {
                //         clearInterval(intervalId); // Clear the interval
                //     }
                // }, 1000); //


            });
    }, 100); // Debounce time in milliseconds (e.g., 300ms)
});


function togglePlayPause() {
    if (videoElement.paused) {
        videoElement.play();
        //playPauseBtn.textContent = "Pause";
    } else {
        videoElement.pause();
        //playPauseBtn.textContent = "Play ";
    }
}

// playPauseBtn.addEventListener('click', async () => {
//     // try {
//     //     const response = await fetch('/mpv-pause-cycle', {
//     //         method: 'POST',
//     //     });
//     //     const data = await response.json();
//     //     document.getElementById('result').innerText = data.message;
//     // } catch (error) {
//     //     // Handle errors, if any
//     //     console.error('Error:', error);
//     //     document.getElementById('result').innerText = 'Error occurred. Please try again.';
//     // }
//     togglePlayPause();
// });



async function makeRequest() {
    try {
        // console.log("mreq ", bSeeking)
        if (!bSeeking) {
            let frags = hls.levels[hls.currentLevel].details.fragments;
            let last = frags[frags.length - 1];
            let d = last.start - currentSegmentStartTime;
            const response = await fetch('/mpv-get-perc-pos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ clientPlaybackD: d }),
            });
            const data = await response.json();
            document.getElementById('seek-slider').value = data.number;
        }
        else console.log("seeking, get perc pos aborted")
    } catch (error) {
        console.error('Error:', error);
    }
}

//makeRequest();

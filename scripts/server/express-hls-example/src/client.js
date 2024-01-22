
const videoElement = document.getElementById('video');
const seekSlider = document.getElementById('seek-slider'); 

var currentSegmentStartTime = 0;
let hls = null;

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

        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
                data.details === Hls.ErrorDetails.LEVEL_LOAD_ERROR ||
                data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR) {
                if (data.response && data.response.code === 404) {
                    console.log('Error: 404 Not Found callback');
                    console.log('reloading page');
                    setTimeout(() => {
                        location.reload();  
                    }, 5000);                                     
                } else {
                    // Handle other HLS errors
                    console.log('Error: ' + data.details);
                }
            }
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

document.addEventListener('DOMContentLoaded', function () {
    if (playInterval)
            clearInterval(playInterval);
    playInterval = setInterval(makeRequest, 4000);

    isPlayerRunning()
        .then(result => {
            isTherePlayer = result.player_status == "STARTING" || result.player_status == "RUNNING";
            if (isTherePlayer) {
                startPlayEv();
            }
            else
                showFileBrowser();
            procVars(result);

            console.log('Player status:', result.player_status);
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
    
    videoElement.addEventListener('play', function () {
        remotePause("noAction");
    });
    //seekSlider.addEventListener('input', handleSeekBarInput);
    //playPauseBtn.addEventListener('click', playPauseFun);
    
    subCycleBtn.addEventListener('click', async () => {
        trackReqFun("sub", "cycle", null);
    });
    
    audioCycleBtn.addEventListener('click', async () => {
        trackReqFun("audio", "cycle", null);
    });
    
});

// videoElement .onwaiting = function() {
//     console.log("Video is buffering");
// };

// videoElement.onplaying = function () {
//     console.log("Video is no longer buffering and is playing");
//     if (bSeeking) {
//         videoElement.currentTime = videoElement.duration;
//         bSeeking = false;
//     }
// };


function togglePlayPause() {
    if (videoElement.paused) {
        videoElement.play();
        //playPauseBtn.textContent = "Pause";
    } else {
        videoElement.pause();
        //playPauseBtn.textContent = "Play ";
    }
}




//makeRequest();

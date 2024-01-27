
const seekSlider = document.getElementById('seek-slider-remote');
trackFieldElem =  document.getElementById('trackfield-remote'); 
bIsRemoteWindow = true;

document.addEventListener('DOMContentLoaded', function () {
    if (playInterval)
            clearInterval(playInterval);
    playInterval = setInterval(makeRequest, 4000);

    isPlayerRunning()
        .then(result => {
            isTherePlayer = result.player_status == "STARTING" || result.player_status == "RUNNING";
            if (!isTherePlayer) 
                showFileBrowser();
            procVars(result);
            console.log('Player status:', result.player_status);
        }).catch(error => { console.error('Error:', error); });

   // bIsRemotePaused = localStorage.getItem('is_remote_paused');

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
    playBtn.addEventListener('click',   function() {
        bIsRemotePaused = "pauseQueued";
        remotePause("pauseQueued");
    });
    pauseBtn.addEventListener('click',   function() {
        bIsRemotePaused = "playQueued";
        remotePause("playQueued");
    });

    stepFwdBtn.addEventListener('click',   function() {     shortSeek(true);    });
    stepBackBtn.addEventListener('click',   function() {     shortSeek(false);    });
        
});


// playPauseBtn.addEventListener('click',   function() {
//     bIsRemotePaused = !bIsRemotePaused;
//     if (bIsRemotePaused)
//         playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
//     else
//         playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';

//     remotePause(bIsRemotePaused);
// });


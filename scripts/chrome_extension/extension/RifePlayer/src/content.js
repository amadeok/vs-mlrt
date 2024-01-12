// content.js
// const script = document.createElement('script');

// // Set the src attribute to the file path of your script
// script.src = chrome.extension.getURL('script.js');

// script.textContent = `
// console.log("content.js injected")
// `;

// // Append the script to the document
// document.documentElement.appendChild(script);
// content.js

// Check if the script has already been injected
// chrome.runtime.sendMessage({ action: "checkInjected" }, function (response) {
//   if (!response || !response.injected) {
//     // Set a flag to indicate that the script has been injected
//     chrome.runtime.sendMessage({ action: "setInjected" });

//     // Your code here
//     console.log("Page reloaded!");
//   }
// });


if (!window.hasScriptInjected) {
  window.hasScriptInjected = true;
  console.log("Content script injected!");

  const videoElement = document.querySelector('video');


  if (window.self === window.top || videoElement) {

    const documentWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const documentHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    //var borderWidth = (window.outerWidth - window.innerWidth) / 2;
    let heightD = window.outerHeight - window.innerHeight;
    let widthD = window.outerWidth - window.innerWidth;

    console.log("window stats ", window, " | ", window.outerHeight, window.innerHeight, heightD, " | ", window.outerWidth, window.innerWidth, widthD)

    console.log("content.js", document, " === top ", window.self === window.top, " videoElement ", videoElement)

    function getAllIframeIds() {
      var iframes = document.getElementsByTagName('iframe');
      console.log("iframes1  ", iframes)
      // var iframeIds = Array.from(iframes).map(function(iframe) {    return iframe.id;  });
      return iframes;
    }

    // setTimeout(function () {
    //   chrome.runtime.sendMessage({
    //     action: "getIframeIds", iframeIds: getAllIframeIds()
    //   });
    // }, 1000);


    function dispatchSpaceKeyEventUntilSeekBarFound(maxAttempts = 10) {
      let attempts = 0;

      return new Promise((resolve, reject) => {

        const spaceKeyEvent = new KeyboardEvent("keydown", { bubbles: true, keyCode: 0 });

        const videoElement = document.querySelector('video');
        //<button aria-label="Play" class="large iconOnly ltr-1akutud" type="button"><div class="large ltr-iyulz3" role="presentation"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="svg-icon svg-icon-play ltr-4z3qvp e1svuwfo1" data-name="Play" aria-hidden="true"><path d="M5 2.69127C5 1.93067 5.81547 1.44851 6.48192 1.81506L23.4069 11.1238C24.0977 11.5037 24.0977 12.4963 23.4069 12.8762L6.48192 22.1849C5.81546 22.5515 5 22.0693 5 21.3087V2.69127Z" fill="currentColor"></path></svg></div></button>
        const checkSeekBar = () => {
          videoElement.dispatchEvent(spaceKeyEvent);
          const seekBar = document.querySelector('[data-uia="timeline"]');
          if (seekBar) {
            resolve(seekBar);
          } else if (attempts < maxAttempts) {
            attempts++;
            var playButton = document.querySelector('[aria-label="Play"]');
            if (playButton) {
              console.log("Found element:", playButton);
              playButton.click();
            } else
              console.log("Element with aria-label 'Play' not found.");
            //console.log("att", attempts)
            setTimeout(checkSeekBar, 100); // Check again after 100 milliseconds
          } else {
            reject(new Error(`Maximum attempts (${maxAttempts}) reached. SeekBar not found.`));
          }
        };

        checkSeekBar();
      });
    }


    // function seekByClick(desiredPercentage) {

    //   const videoElement = document.querySelector('video');

    //   dispatchSpaceKeyEventUntilSeekBarFound(10)
    //     .then(seekBar => {
    //       console.log("SeekBar found:", seekBar);
    //       if (videoElement && seekBar) {

    //         const totalDuration = videoElement.duration;
    //         const desiredTime = (desiredPercentage / 100) * totalDuration;

    //         const rect = seekBar.getBoundingClientRect();
    //         const mouseX = rect.left + (desiredPercentage / 100) * rect.width;
    //         const mouseY = rect.top + rect.height / 2;

    //         const mousedownEvent = new MouseEvent('mousedown', { bubbles: true, clientX: mouseX, clientY: mouseY });

    //         seekBar.dispatchEvent(mousedownEvent);

    //         const mouseupEvent = new MouseEvent('mouseup', { bubbles: true, clientX: mouseX, clientY: mouseY });

    //         seekBar.dispatchEvent(mouseupEvent);

    //         console.log('Set current time to:', desiredTime);
    //       } else {
    //         console.error('Video element or seek bar not found');
    //       }
    //     })
    //     .catch(error => {
    //       console.log("Error:", error);

    //     });
    // }
    function checkNetflixPlayBtn() {
      if (document.title.includes("Netflix")) {
        var playButton = document.querySelector('[aria-label="Play"]');
        if (playButton) {
          console.log("Found netflix long paused play button element:", playButton);
          playButton.click();
        }
      }
    }
    function seekByClick(desiredPercentage) {
      return new Promise((resolve, reject) => {
        const videoElement = document.querySelector('video');

        dispatchSpaceKeyEventUntilSeekBarFound(10)
          .then(seekBar => {
            console.log("SeekBar found:", seekBar);
            if (videoElement && seekBar) {
              const totalDuration = videoElement.duration;
              const desiredTime = (desiredPercentage / 100) * totalDuration;

              const rect = seekBar.getBoundingClientRect();
              const mouseX = rect.left + (desiredPercentage / 100) * rect.width;
              const mouseY = rect.top + rect.height / 2;

              const mousedownEvent = new MouseEvent('mousedown', { bubbles: true, clientX: mouseX, clientY: mouseY });

              seekBar.dispatchEvent(mousedownEvent);

              const mouseupEvent = new MouseEvent('mouseup', { bubbles: true, clientX: mouseX, clientY: mouseY });

              seekBar.dispatchEvent(mouseupEvent);

              //console.log('Set current time to:', desiredTime);
              setTimeout(function () {
                resolve(desiredTime);
              }, 300);

            } else {
              console.error('Video element or seek bar not found');
              reject('Video element or seek bar not found');
            }
          })
          .catch(error => {
            console.log("Error:", error);
            reject(error);
          });
      });
    }

    function checkPlaybackTime(videoElement, seekTime, request, sendResponse, tolerance) {
      let d = Math.abs(videoElement.currentTime - seekTime);
      console.log('Current playback time:', videoElement.currentTime, " | % ", request.action.operation_details, " | delta ", d);
      if (d < tolerance) {
        sendResponse({ operation_result: true });
      } else {
        let errorMsg = 'Video seek failed. Current time: ' + videoElement.currentTime + ', Seek time: ' + seekTime;
        sendResponse({ operation_result: false, error: errorMsg });
        console.log(errorMsg);
      }
    }


    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      console.log("request", request)
      console.log("Op: ", request.action.operation_type, " | det2 ", request.action.operation_details)
      var videoElement = document.querySelector('video');

      if (request.action.operation_type === 'video_pause') {
        checkNetflixPlayBtn();
        if (!request.action.operation_details) {
          if (videoElement.paused)
            videoElement.play();
          sendResponse({ operation_result: !videoElement.paused });
        } else {
          if (!videoElement.paused)
            videoElement.pause();
          sendResponse({ operation_result: videoElement.paused });
        }
      }
      else if (request.action.operation_type === 'seek') {
        // var videoElement = document.querySelector('video');
        if (document.title.includes("Netflix")) {
          seekByClick(request.action.operation_details)
            .then(seekTime => {
              checkPlaybackTime(videoElement, seekTime, request, sendResponse, 20);
            }).catch(error => { console.log('Error:', error); sendResponse({ operation_result: false, error: error }); });
        }
        else {
          let seekTime = (request.action.operation_details / 100) * videoElement.duration;
          videoElement.currentTime = seekTime;
          checkPlaybackTime(videoElement, seekTime, request, sendResponse, 3);
        }
      }
      else if (request.action.operation_type === 'get_duration_and_curtime') {
        if (videoElement)
          sendResponse({ operation_result: true, data: { video_duration: videoElement.duration, video_curTime: videoElement.currentTime } });
        else
          sendResponse({ operation_result: false, data: { video_duration: null, video_curTime: null }, error: "Video element not found" });
      }
      else if (request.action.operation_type === 'press_key') {
        checkNetflixPlayBtn();
        var keyEvent1 = new KeyboardEvent("keydown", { bubbles: true, keyCode: 0 });
        videoElement.dispatchEvent(keyEvent1);
        console.log("keycode ", request.action.operation_details)
        var keyEvent = new KeyboardEvent("keydown", { bubbles: true, keyCode: request.action.operation_details.keyCode });
        videoElement.dispatchEvent(keyEvent);
        sendResponse({ operation_result: true });
      }
      else if (request.action.task === 'extractAttributes') {
        const elements = document.querySelectorAll('*');
        const attributes = Array.from(elements).map(element => ({
          tag: element.tagName,
          id: element.id,
          class: element.className,
          attributes: Array.from(element.attributes),
        }));
        var spaceKeyEvent2 = new KeyboardEvent("keydown", {
          bubbles: true, //has to be there
          keyCode: 37, //has to be there
        });

        // const iframes = document.getElementsByClassName('video-player'); // for crunchyroll
        // const iframe = iframes[0]; // for crunchyroll


        //   //const elementInsideIframe = iframe.contentDocument.getElementById('elementInsideIframe');
        //   var videoElement = iframe.contentWindow.document.querySelector('video'); //won't work because of cross-origin browser block
        //   console.log('--> videoElement ', videoElement);

        //   videoElement.currentTime = 200; //doesn't work on netflix
        //  seekByClick(90);



        // console.log(spaceKeyEvent2.code, spaceKeyEvent2.keyCode)
        //videoElement.dispatchEvent(spaceKeyEvent2);
        // You can send the attributes to the background script or perform any desired actions
        sendResponse({ data: attributes });

        //chrome.runtime.sendMessage({ action: 'attributesExtracted', attributes });
      }
    });
  }







  chrome.runtime.sendMessage({ action: "scriptInjected" });
}

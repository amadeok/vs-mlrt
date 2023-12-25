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

    const documentWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0 );
    const documentHeight = Math.max( document.documentElement.clientHeight || 0,window.innerHeight || 0 );
    //var borderWidth = (window.outerWidth - window.innerWidth) / 2;
    let heightD = window.outerHeight- window.innerHeight;
    let widthD =  window.outerWidth- window.innerWidth;

    console.log("window stats ",window, " | ", window.outerHeight, window.innerHeight, heightD,  " | ", window.outerWidth, window.innerWidth, widthD)

    console.log("content.js", document, " === top ", window.self === window.top, " videoElement ",videoElement)

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

        const checkSeekBar = () => {
          videoElement.dispatchEvent(spaceKeyEvent);
          const seekBar = document.querySelector('[data-uia="timeline"]');
          if (seekBar) {
            resolve(seekBar);
          } else if (attempts < maxAttempts) {
            attempts++;
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
      console.log("Op: ", request.action.operation_type, " | det ", request.action.operation_details)
      var videoElement = document.querySelector('video');

      if (request.action.operation_type === 'pause_video') {
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
      else if (request.action.operation_type === 'get_duration_and_curtime'){
        sendResponse({ operation_result: true, data: {video_duration: videoElement.duration, video_curTime:  videoElement.currentTime} });
      }
      if (request.action.task === 'extractAttributes') {
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

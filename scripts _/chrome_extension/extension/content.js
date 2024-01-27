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


    function seekByClick(desiredPercentage) {

      const videoElement = document.querySelector('video');

      dispatchSpaceKeyEventUntilSeekBarFound(10)
        .then(seekBar => {
          console.log("SeekBar found:", seekBar);
          if (videoElement && seekBar) {

            // Calculate the corresponding time based on the percentage
            const totalDuration = videoElement.duration;
            const desiredTime = (desiredPercentage / 100) * totalDuration;

            // Simulate a mousedown event on the seek bar at the desired percentage
            const rect = seekBar.getBoundingClientRect();
            const mouseX = rect.left + (desiredPercentage / 100) * rect.width;
            const mouseY = rect.top + rect.height / 2;

            const mousedownEvent = new MouseEvent('mousedown', {
              bubbles: true,
              clientX: mouseX,
              clientY: mouseY
            });

            seekBar.dispatchEvent(mousedownEvent);

            // Update the current time of the video element
            //videoElement.currentTime = desiredTime;
            // Simulate a mouseup event to complete the seek operation
            const mouseupEvent = new MouseEvent('mouseup', {
              bubbles: true,
              clientX: mouseX,
              clientY: mouseY
            });

            seekBar.dispatchEvent(mouseupEvent);

            console.log('Set current time to:', desiredTime);
          } else {
            console.error('Video element or seek bar not found');
          }
        })
        .catch(error => {
          console.log("Error:", error);

        });
    }


    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      console.log("request", request)
      if (request.action.task === 'extractAttributes') {
        
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

        console.log('----> extractAttributes');
        var videoElement = document.querySelector('video');
        console.log('--> videoElement ', videoElement);

        
        if (document.title.includes("Netflix"))
          seekByClick(request.action.arg1);
        else
          videoElement.currentTime = 210; //doesn't work on netflix
         console.log('Current playback time:', videoElement.currentTime);

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

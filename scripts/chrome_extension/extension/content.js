// content.js
console.log("content.js")
// Create a script element
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



chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'extractAttributes') {
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
             var videoElement = document.querySelector('video');

            console.log(spaceKeyEvent2.code, spaceKeyEvent2.keyCode)
            videoElement.dispatchEvent(spaceKeyEvent2);
    // You can send the attributes to the background script or perform any desired actions
    chrome.runtime.sendMessage({ action: 'attributesExtracted', attributes });
  }
});
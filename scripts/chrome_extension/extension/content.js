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
chrome.runtime.sendMessage({ action: "checkInjected" }, function (response) {
  if (!response || !response.injected) {
    // Set a flag to indicate that the script has been injected
    chrome.runtime.sendMessage({ action: "setInjected" });

    // Your code here
    console.log("Page reloaded!");
  }
});

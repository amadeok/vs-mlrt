// content.js

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "findElement") {
    waitForElement(request.selector);
  }
});

function waitForElement(selector) {
  var intervalId = setInterval(function () {
    var element = document.querySelector(selector);
    if (element) {
      clearInterval(intervalId);
      // Do something with the found element
      console.log("Element found:", element);
    }
  }, 1000); // Adjust the interval as needed
}

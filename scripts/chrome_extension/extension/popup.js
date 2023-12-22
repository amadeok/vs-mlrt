// always waits the document to be loaded when shown
document.addEventListener('DOMContentLoaded', function() {

  // opens a communication between scripts
  var port = chrome.runtime.connect();
  // listens to the click of the button into the popup content
  document.getElementById('popupBtn').addEventListener('click', function() {

      // sends a message throw the communication port
      port.postMessage({
          'from': 'popup',
          'start': 'Y'
      });
  });
  document.getElementById('extractButton').addEventListener('click', function () {
    chrome.tabs.query({ active: true }, function (tabs) {
      console.log("tabb", tabs[0])
      chrome.runtime.sendMessage({ action: 'extractAttributes', tabId: tabs[0].id });
    });
  });
});


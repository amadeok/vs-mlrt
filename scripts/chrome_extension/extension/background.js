// opens a communication port
console.log("hello back")

// chrome.webNavigation.onCompleted.addListener(function (details) {
//   console.log("webNavigation", details)
//   //  if (details.status == 'complete' && details.active) {
//   // chrome.runtime.sendMessage(details.tabId, { action: "checkInjected" }, function (response) {
//   // if (!response || !response.injected) {
//   // Content script has not been injected, inject it now
//   chrome.tabs.query({ active: true }, function (tabs) {

//       var activeTab = tabs[0]; // can be more than one if there are multiple windows
//       if (details.tabId === activeTab.id) {

//       console.log("tabs", tabs)
//       console.log("activeTab", activeTab)

//       chrome.scripting.executeScript({
//         target: { tabId: activeTab.id },
//         files: ['script.js'],
//       });
//     }
//   });
// });

// chrome.tabs.onActivated.addListener( function(activeInfo){
//   chrome.tabs.get(activeInfo.tabId, function(tab){
//       y = tab.url;
//       console.log("you are here: "+y);
//   });
// });

// chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
//   if (tab.active && change.url) {
//       console.log("you are here: "+change.url);           
//   }
// });
HOST = 'ws://127.0.0.1:65432'; // WebSocket server address

socket = new WebSocket(HOST);    
console.log("websocket created for ", HOST)

socket.addEventListener('open', (event) => {
    console.log('Connected to server');
    socket.send('Hello, world, test back:' );
});

socket.addEventListener('message', (event) => {
//      console.log("event ", event)
    const message = JSON.parse(event.data);

    if (message.type === 'perform_operation') {
         console.log('Performing operation:', message.operation_type);
         console.log("element title: ", document.title, "| cap win title: ", message.cap_win_title)
         if (!message.cap_win_title.includes(document.title)){
            socket.send('Closing socket with title "' + document.title +  "\" because of title mismatch");

            socket.close(1000, 'Closing connection gracefully because title mismatch');
         }
    }else if (message.type === 'message') {
        console.log('Server message :', message.message_content);
    }
});


socket.addEventListener('close', (event) => {
    console.log('Connection closed');
});

console.log("Bg Interval set ")
interval = setInterval(function() {
  chrome.tabs.query({ active: true  }, function (tabs) { // lastFocusedWindow: true 
  //  console.log("tabs ", tabs)

    chrome.windows.getCurrent(function(window) {
      //console.log(window);
      // You can access window properties like window.id, window.title, etc.
       
      var activeTab = tabs[0]; // can be more than one if there are multiple windows
      let found = false;
      for (var tab of tabs) {
       // if (tab.windowId == window.id)
       if (tab.title.includes("Netflix"))
        {
          found = true;
          activeTab = tab;
        }
      }
      if (!found)
        console.log("warning: faled to match active window to active tab:", activeTab)
      else
        console.log("activeTab matched to window", activeTab)
        chrome.tabs.sendMessage(activeTab.id, { action: 'extractAttributes' });

      // chrome.scripting.executeScript({
      //   target: { tabId: activeTab.id },
      //   files: ['script.js'],
    //  });
    });


  
});
}, 10*1000);



chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("back on message ", request)
  if (request.action === 'extractAttributes') {
    chrome.tabs.sendMessage(request.tabId, { action: 'extractAttributes' });
  }
});



// //if ( window["injectedStatus"] === undefined)
// let injectedStatus = {};

// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   var tabId = sender.tab.id;

//   if (request.action === "checkInjected") {
//     sendResponse({ injected: injectedStatus[tabId] });
//   } else if (request.action === "setInjected") {
//     injectedStatus[tabId] = true;
//   }
// });



// do your things

//   chrome.tabs.query({ active: true }, function(tabs) {

//   var activeTab = tabs[0]; // can be more than one if there are multiple windows
//  console.log("tabs", tabs)
//   console.log("activeTab", activeTab)

//   chrome.scripting.executeScript({
//     target: { tabId: activeTab.id },
//     files: ['script.js'],
//   });
// });
// chrome.tabs.executeScript(details.tabId, { file: "content.js" });
// }
// })

// chrome.tabs.query({ active: true }, function(tabs) {
//   var activeTab = tabs[0]; // can be more than one if there are multiple windows
//  console.log("tabs", tabs)
//   console.log("activeTab", activeTab)

//   chrome.scripting.executeScript({
//     target: { tabId: activeTab.id },
//     files: ['script.js'],
//   });
// });

chrome.runtime.onConnect.addListener(function (port) {

  // listen for every message passing throw it
  port.onMessage.addListener(function (o) {

    // if the message comes from the popup
    if (o.from && o.from === 'popup' && o.start && o.start === 'Y') {

      // inserts a script into your tab content
      // chrome.tabs.executeScript(null, {

      //     // the script will click the button into the tab content
      //     code: "document.getElementById('pageBtn').click();"
      // });
      console.log("com success")

      chrome.tabs.query({ active: true }, function (tabs) {
        var activeTab = tabs[0]; // can be more than one if there are multiple windows
        console.log("tabs", tabs)
        console.log("activeTab", activeTab)

        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ['script.js'],
          // function: function () {
          //   console.log("executeScript")

          //   document.addEventListener("keydown", function(event) {           
          //     var currentTarget = event.currentTarget; // Access the currentTarget property to get the current target element                      
          //     console.log("Current Target:", currentTarget);                       // Log or do something with the current target
          //   });

          //   elem = document.getElementsByClassName('ltr-1enhvti')
          //   console.log("elem ", elem)
          //   //elem[2].click()
          //   var videoElement = document.querySelector('video');
          //   const rect = videoElement.getBoundingClientRect();
          //   const x = rect.x || rect.left; 
          //   const y = rect.y || rect.top;   
          //   console.log("KE video elem ", x, y, rect.width, rect.height, videoElement.videoWidth, videoElement.videoHeight, 
          //                 " | ", rect.width/ rect.height , "  ",videoElement.paused)
          //   // videoElement.click()
          //   // console.log("video paused ", videoElement.paused)
          //   videoElement.focus();
          //   // var mEvent = document.createEvent("MouseEvent");
          //   // mEvent.initMouseEvent("click", true, true, window, 0,  0, 0, 0, 0, false, false, false, false,  0, null);
          //   // var kEvent = document.createEvent("KeyboardEvent");
          //   // kEvent.initKeyboardEvent("keydown", true, true, window, "ArrowLeft", 0, null, false, null);
          //   // kEvent.keyCode = 37;                 KE video elem  0 -76 1940 1366 1920 1080  |  1.4202049780380674    true


          //   var spaceKeyEvent2 = new KeyboardEvent("keydown", {
          //      bubbles: true, //has to be there
          //     // cancelable: true,
          //     // view: window,
          //     // key: "ArrowLeft",
          //     // code: "ArrowLeft",
          //    // location: 0,
          //     // ctrlKey: false,
          //     // altKey: false,
          //     // shiftKey: true,
          //     // metaKey: false,
          //     // repeat: false,
          //     // isComposing: false,
          //  //   charCode: 0,
          //     keyCode: 37, //has to be there
          //   });

          //   console.log(spaceKeyEvent2.code, spaceKeyEvent2.keyCode)
          //   //var e = new KeyboardEvent('keydown',{'keyCode':32,'which':32});
          //   console.log("video paused ", videoElement.paused)
          //   videoElement.dispatchEvent(spaceKeyEvent2);
          //  // videoElement.click()
          //   setTimeout(function() {
          //      console.log("video paused ", videoElement.paused)
          //   }, 400);

          //   function simulateClick(x, y) {
          //     var element = document.elementFromPoint(x, y);

          //     if (element) {
          //       var clickEvent = new MouseEvent('click', {
          //         bubbles: true,
          //         cancelable: true,
          //         clientX: x,
          //         clientY: y
          //       });

          //       element.dispatchEvent(clickEvent);
          //     } else {
          //       console.error('No element found at coordinates (' + x + ', ' + y + ').');
          //     }
          //   }
          //   //simulateClick(100, 1050);

          //  // console.log("e ", e)


          //   // console.log("menu", document.getElementById('menu-open'), " ", document.getElementById('menu-open').getAttribute("aria-label"))
          //   // alert('Hello from the content script!' + document.getElementById('menu-open').getAttribute("aria-label") );
          // }
        });
      });
      // chrome.scripting.executeScript({
      //     target: {allFrames: true},
      //     files: ['script.js'],
      // });
    }
  });
});
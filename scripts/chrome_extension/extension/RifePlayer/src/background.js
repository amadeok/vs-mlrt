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

// var injectedPages = [];

// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//   if (request.action === "scriptInjected") {
//     if (injectedPages.indexOf(sender.url) === -1) {
//       injectedPages.push(sender.url);
//       console.log("Content script has been injected on pages:", injectedPages);
//     }
//   }
// });
// background.js

class WebSocketClient {
  constructor(host) {
    this.HOST = host;

    this.createSocket();

    setInterval(() => {
      if (this.socket.readyState !== WebSocket.OPEN) {
        this.createSocket();
      } else {
        //   console.log('socket exists');
        // this.socket.send('succesive msg from client ' + document.title);
      }

    }, 10000);

  }
  createSocket() {
    this.socket = new WebSocket(this.HOST);
    this.socket.addEventListener('open', this.onOpen.bind(this));
    this.socket.addEventListener('message', this.onMessage.bind(this));
    this.socket.addEventListener('close', this.onClose.bind(this));
  }

  getMostSimilarWin(cap_win_rect) {
    return new Promise((resolve, reject) => {
      chrome.windows.getAll({ populate: true }, function (windows) {
        if (chrome.runtime.lastError) {
          // Handle errors
          reject(chrome.runtime.lastError);
        } else {
          // Resolve with the windows when the operation is completed
          chrome.windows.getAll({ populate: false }, function (windows) {
            const givenPosition = { left: cap_win_rect.left, top: cap_win_rect.top };
            const givenSize = { width: cap_win_rect.w, height: cap_win_rect.h };
            let mostSimilarWindow = null;
            let minDifference = Number.MAX_SAFE_INTEGER;
            windows.forEach(function (window) {
              const positionDifference = Math.abs(window.left - givenPosition.left) + Math.abs(window.top - givenPosition.top);
              const sizeDifference = Math.abs(window.width - givenSize.width) + Math.abs(window.height - givenSize.height);
              const totalDifference = positionDifference + sizeDifference;
              // console.log("pos dif: ", positionDifference, " | size dif ", sizeDifference )
              // Update the most similar window if the current window is closer
              if (totalDifference < minDifference) {
                minDifference = totalDifference;
                mostSimilarWindow = window;
              }
            });
            // console.log("Most Similar Window:", mostSimilarWindow);
            resolve(mostSimilarWindow);
          });
        }
      });
    });
  }

  determineTab(cap_win_title, cap_win_rect, this_) {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({}, function (tabs) {
        let activeTab = null;

        const filteredTabs = tabs.filter(tab => cap_win_title.includes(tab.title));

        this_.getMostSimilarWin(cap_win_rect)
          .then(mostSimilarWindow => {
            let win = mostSimilarWindow;

            if (filteredTabs.length == 0) {
              console.log("Tab not found from given cap win title:", cap_win_title, " getting active tab of most similar window");
              const filteredByActive = tabs.filter(tab => tab.active == true);
              activeTab = filteredByActive[0]
              if (filteredByActive.length > 1) {
                myWebSocket.socket.send(JSON.stringify({ type: "log", message: 'More than one tab found, try keeping only one open'}));
              }
            } else if (filteredTabs.length > 1) {
              console.log("Found multiple tabs with title ", cap_win_title, ", comparing against given window")
              const filteredByWin = filteredTabs.filter(tab => tab.windowId == win.id);
              if (filteredTabs.length > 1) {
                const filteredByActive = filteredTabs.filter(tab => tab.active == true);
                activeTab = (filteredByActive.length > 0) ? filteredByActive[0] : null;
                if (filteredByActive.length > 1) {
                  myWebSocket.socket.send(JSON.stringify({ type: "log", message: 'More than one tab with title: "' + cap_win_title + '" found, close one'}));
                }
              } else
                activeTab = (filteredByWin.length > 0) ? filteredByWin[0] : null;
            } else {
              activeTab = (filteredTabs.length > 0) ? filteredTabs[0] : null;
              if (filteredTabs[0] && filteredTabs[0].windowId != win.id)
                console.log("Tab with title found but doesn't match found window id");
            }

            resolve(activeTab);
          })
          .catch(error => {
            console.log("Error getting windows:", error);
            reject(error);
          });
      });
    });
  }
  

  onOpen(event) {
    console.log('Connected to server');
    this.socket.send(JSON.stringify({ type: "log", message: 'Client first message'}));
  }

  onMessage(event) {
    const message = JSON.parse(event.data);
    if (message.type === 'perform_operation') {
      console.log('Performing operation:', message.operation_type);
      //console.log("cap win title: ", message.cap_win_title, "|", message.cap_win_rect);
      // this.cap_win_title = message.cap_win_title;
      // this.cap_win_rect = message.cap_win_rect;
      this.determineTab(message.cap_win_title, message.cap_win_rect, this)
        .then(selectedTab => {
          console.log('Selected tab: "', selectedTab.title, '" | win id ', selectedTab.windowId, selectedTab.tabId, selectedTab.active)

          chrome.scripting.executeScript({ //to inject into video iframe for crunchyroll
            "files": ['content.js'],
            "target": { tabId: selectedTab.id, "allFrames": selectedTab.title.includes("Crunchyroll") }
          }, result => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
            } else {// console.log('Script execution result:', result);
              chrome.tabs.sendMessage(selectedTab.id, { action: { operation_type:message.operation_type, operation_details: message.operation_details } },
                function (response) {
                  if (chrome.runtime.lastError) { console.log("ERROR", chrome.runtime.lastError); }
                  else { 
                    console.log('Response received:', response);
                    if (response.data){
                      let obj = { type: "data", data: response.data, resposeOf: message.operation_type }
                      console.log('sending response to server:',response.data, " | ", obj );
                      myWebSocket.socket.send(JSON.stringify(obj));
                    }
                  }
                });
            }
          });
          // chrome.tabs.sendMessage(selectedTab.id, { action: {task: 'extractAttributes', arg1: 10}});
        }).catch(error => { console.log(error); });

    } else if (message.type === 'message') {
      console.log('Server message:', message.message_content, " | ", message.cap_win_title, message.cap_win_rect.left,
        message.cap_win_rect.top, message.cap_win_rect.w, message.cap_win_rect.h);
    }
  }

  onClose(event) {
    console.log('Connection closed');
  }
}

myWebSocket = new WebSocketClient('ws://127.0.0.1:65432');
console.log("websocket created for ", myWebSocket.HOST);


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getIframeIds") {
    // Log or handle the iframe IDs in the background script
    console.log("Iframe IDs in the current tab:", request.iframeIds);
  }
});


chrome.commands.onCommand.addListener(function(command) {
  if (command === "executeAction") {
    console.log("Restarting websocket");

    myWebSocket.socket.close()
    myWebSocket.createSocket()
  }
});


//let windowList = null;

// console.log("Bg Interval set ")
// interval = setInterval(function() {
//   chrome.windows.getAll({ populate: false }, function (windows) {
//     if (chrome.runtime.lastError) {
//         console.error(chrome.runtime.lastError);
//         return;
//     }
//     windowList = windows;
//     console.log("Windows :");
//     windowList.forEach(function (window) {
//       //console.log(window);
//          console.log("Window Position - Left:", window.left, ", Top:", window.top, " Width:", window.width, ", Height:", window.height);
//     });
//     console.log("----------------------------");
// });

//   chrome.tabs.query({ active: true  }, function (tabs) { // lastFocusedWindow: true 
//   //  console.log("tabs ", tabs)

//     chrome.windows.getCurrent(function(window) {
//       //console.log(window);
//       // You can access window properties like window.id, window.title, etc.

//       var activeTab = tabs[0]; // can be more than one if there are multiple windows
//       let found = false;
//       for (var tab of tabs) {
//        // if (tab.windowId == window.id)
//        if (tab.title.includes("Netflix"))
//         {
//           found = true;
//           activeTab = tab;
//         }
//       }
//       if (!found)
//         console.log("warning: faled to match active window to active tab:", activeTab)
//       else
//         console.log("activeTab matched to window", activeTab)

//       //   chrome.scripting.executeScript({ //to inject into video iframe for crunchyroll
//       //     "files": ["script.js"],
//       //     "target": {tabId: activeTab.id, "allFrames" : true}
//       // });
//         chrome.tabs.sendMessage(activeTab.id, { action: 'extractAttributes' });

//       // chrome.scripting.executeScript({
//       //   target: { tabId: activeTab.id },
//       //   files: ['script.js'],
//     //  });
//     });



// });
// }, 10*1000);



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
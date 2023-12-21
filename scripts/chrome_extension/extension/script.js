
//function task(){
    // if (!localStorage.getItem('scriptHasRun')) {
    //     // Your script logic here
    //     localStorage.setItem('scriptHasRun', true);
    //   }
console.log("script.js loaded and run", localStorage.getItem('scriptHasRun'))

function isVariableDefined(variableName) {
    return window[variableName] !== undefined; //|| global[variableName] !== undefined;
    }
socketDefined = isVariableDefined("socket");


function connectWebSocket() {
    HOST = 'ws://127.0.0.1:65432'; // WebSocket server address

    socket = new WebSocket(HOST);    
    console.log("websocket created for ", HOST)

    socket.addEventListener('open', (event) => {
        console.log('Connected to server');
        socket.send('Hello, world' + document.title);
    });

    socket.addEventListener('message', (event) => {
        console.log(`Received ${event.data}`);
    //  socket.close();
    });

    socket.addEventListener('close', (event) => {
        console.log('Connection closed');
    });
  }

  
if (!socketDefined || socketDefined && socket.readyState !== WebSocket.OPEN) {
    connectWebSocket();
} else{
    console.log('socket exists');
    socket.send('succesive msg from client ' +  document.title);

}

// if (!isVariableDefined("interval")){
//     console.log("Interval set ")
//     interval = setInterval(function() {
//     console.log("Checking socket")
//     socketDefined = isVariableDefined("socket");
//     if (!socketDefined || socketDefined && socket.readyState !== WebSocket.OPEN) {
//             connectWebSocket();
//     }
//     }, 10*1000);
// }


// }
// task();

// // Example WebSocket URL
// const websocketUrl = 'ws://localhost:8001';

// // Create a WebSocket connection
// const socket = new WebSocket(websocketUrl);

// // Event listener for when the connection is opened
// socket.addEventListener('open', (event) => {
//   console.log('WebSocket connection opened:', event);
  
//   // Send a message to the server
//   const message = 'Hello, server!';
//   socket.send(message);
// });

// // Event listener for when a message is received from the server
// socket.addEventListener('message', (event) => {
//   console.log('Message from server:', event.data);
// });

// // Event listener for when the connection is closed
// socket.addEventListener('close', (event) => {
//   console.log('WebSocket connection closed:', event);
// });

// // Event listener for errors
// socket.addEventListener('error', (event) => {
//   console.error('WebSocket error:', event);
// });


//const htmlPageUrl = 'http://localhost:8000';

// // Example URL for the JSON data endpoint
// const jsonDataUrl = 'http://localhost:8000/api/data';

// // // Fetch data from the HTML page
// // fetch(htmlPageUrl)
// //   .then(response => {
// //     if (!response.ok) {
// //       throw new Error(`HTTP error! Status: ${response.status}`);
// //     }
// //     return response.text();
// //   })
// //   .then(htmlData => {
// //     // Handle the HTML data
// //     console.log(htmlData);
// //   })
// //   .catch(error => {
// //     // Handle errors
// //     console.error('Error:', error);
// //   });

// // Fetch data from the JSON endpoint
// fetch(jsonDataUrl)
//   .then(response => {
//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }
//     return response.json();
//   })
//   .then(data => {
//     // Handle the JSON data
//     console.log(data);
//   })
//   .catch(error => {
//     // Handle errors
//     console.error('Error:', error);
//   });

// window.onkeydown = vidCtrl;

// function vidCtrl(e) {
//   const vid = document.querySelector('video');
//   const key = e.code;

//   if (key === 'ArrowLeft') {
//   //  vid.currentTime -= 1;
//     if (vid.currentTime < 0) {
//       vid.pause();
//       vid.currentTime = 0;
//     }
//   } else if (key === 'ArrowRight') {
//    // vid.currentTime += 1;
//     if (vid.currentTime > vid.duration) {
//       vid.pause();
//       vid.currentTime = 0;
//     }
//   } else if (key === 'Space') {
//     if (vid.paused || vid.ended) {
//       vid.play();
//     } else {
//       vid.pause();
//     }
//   }
// }


document.addEventListener('keydown', function(event) {
    const videoElement = document.querySelector('video'); // select your video element using an appropriate selector
    console.log("etestestsetse")
    // Check if the pressed key is an arrow key (left, right, up, or down)
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault(); // Prevent the default behavior of arrow keys (seeking in this case)
    }
});
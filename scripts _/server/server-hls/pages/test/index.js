import React from 'react';

// This imports the functional component from the previous sample.
import VideoJS from '../../components/Player';

const App2 = () => {
  // const playerRef = React.useRef(null);

  // const videoJsOptions = {
  //   autoplay: true,
  //   controls: true,
  //   responsive: true,
  //   fluid: true,
  //   sources: [{
  //     src: 'http://192.168.1.160:3000/stream/out.m3u8',
  //    // type: 'video/mp4'
  //   }]
  // };

  // const handlePlayerReady = (player) => {
  //   playerRef.current = player;

  //   // You can handle player events here, for example:
  //   player.on('waiting', () => {
  //     videojs.log('player is waiting');
  //   });

  //   player.on('dispose', () => {
  //     videojs.log('player will dispose');
  //   });
  // };

  return (
    <>
      {/* <div>Rest of app here</div>
      <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
      <div>Rest of app here</div> */}
    </>
  );
}

export default App2
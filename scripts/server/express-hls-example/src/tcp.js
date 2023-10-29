const express = require('express');
const app = express();
const http = require('http').Server(app);
const child_process = require('child_process');
const fs = require('fs');

const PORT = 3000;
//ffmpeg -i "/home/amadeok/Downloads/Demon Slayer/01.mp4" -f mpegts tcp://192.168.1.160:3001

app.get('/', (req, res) => {
  return res.status(200).sendFile(`${__dirname}/tcpclient.html`);
});



app.get('/video', (req, res) => {

  res.setHeader('Content-Type', 'video/mpegts');

  const pathToFifo = '/tmp/mpvfifo2';

  try {
    fs.unlinkSync(pathToFifo);
    child_process.spawnSync("mkfifo", [pathToFifo]);

    child_process.spawnSync("mkfifo", [pathToFifo]);
  } catch (err) {
    console.error(`Error deleting named pipe: ${err.message}`);
  }


  const ffmpegProcess = child_process.spawn('mpv', [
    //'/home/amadeok/Downloads/Demon Slayer/01.mp4', // FFmpeg input stream URL
    '"/home/amadeok/Downloads/Demon Slayer/1.mkv"', // FFmpeg input stream URL
    //'--no-cache',
    // "--o=-",
    "--of=mpegts",
    //"--ovc=copy",
    //  "--oac=pcm_s16le",
    "--ovc=h264_nvenc",
    "--ovcopts-add=preset=p1",
    "--vf='lavfi=[scale=iw/2:-1],vapoursynth:[/home/amadeok/vs-mlrt/scripts/test3.py]':4:8",
    //  "--vf='vapoursynth:[/home/amadeok/vs-mlrt/scripts/test3.py]':4:8",
    "-o",
    pathToFifo
    //"-"
  ], {
    //  stdio: 'inherit',
    shell: true
  });


  if (fs.existsSync(pathToFifo)) {
    const fifoStream = fs.createReadStream(pathToFifo);
    //  fifoStream.on('data', (data) => {
    //    res.send(data);
    // //   //console.log('Received data from FIFO:', data.toString());

    //  });
    fifoStream.pipe(res)

    fifoStream.on('error', (err) => { console.error('Error reading from FIFO:', err); });
    fifoStream.on('end', () => { console.log('End of FIFO stream'); });
  } else { console.error('FIFO file does not exist.'); }

  //ffmpegProcess.stdout.pipe(res);

  ffmpegProcess.stderr.on('data', (data) => {
    console.error(`FFmpeg stderr: ${data}`);
  });

  ffmpegProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`FFmpeg process exited with code ${code}`);
    }
  });

  req.on('close', () => {
    ffmpegProcess.kill();
  });
});

// Start the Express server
http.listen(PORT, "192.168.1.160", () => {
  console.log(`Server is running on port http://192.168.1.160:${PORT} http://192.168.1.160:${PORT}/video`);
});

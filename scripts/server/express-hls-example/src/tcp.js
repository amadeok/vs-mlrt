const express = require('express');
const app = express();
const http = require('http').Server(app);
const child_process = require('child_process');

const PORT = 3000;
//ffmpeg -i "/home/amadeok/Downloads/Demon Slayer/01.mp4" -f mpegts tcp://192.168.1.160:3001

app.get('/', (req, res) => {
    return res.status(200).sendFile(`${__dirname}/tcpclient.html`);
    
});app.get('/video', (req, res) => {

  res.setHeader('Content-Type', 'video/mp2t');
  
  // Use FFmpeg to spawn a child process and stream video to the response
  const ffmpegProcess = child_process.spawn('ffmpeg', [
    '-i', '/home/amadeok/Downloads/Demon Slayer/01.mp4', // FFmpeg input stream URL
    '-codec', 'copy',
    '-f', 'mpegts',
    'pipe:1',
  ]);
  
  // Pipe FFmpeg output to response object
  ffmpegProcess.stdout.pipe(res);
  
  // Handle FFmpeg errors
  ffmpegProcess.stderr.on('data', (data) => {
    console.error(`FFmpeg stderr: ${data}`);
  });
  
  ffmpegProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`FFmpeg process exited with code ${code}`);
    }
    res.end();
  });

  // Handle client disconnect
  req.on('close', () => {
    ffmpegProcess.kill();
  });
});

// Start the Express server
http.listen(PORT, "192.168.1.160", () => {
  console.log(`Server is running on port ${PORT}`);
});

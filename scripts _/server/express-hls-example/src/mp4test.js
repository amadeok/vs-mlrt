const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'mp4test.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

app.get('/your_video', (req, res) => {
    console.log("test")
    res.sendFile("D:\soft\media\Chernobyl.1x01.1.23.45.ITA.ENG.1080p.AMZN.WEB-DLMux.DD5.1.H.264-TRiADE.mkv")
    //res.sendFile(path.join(__dirname, 'public/your_video.mkv'));
  });
  

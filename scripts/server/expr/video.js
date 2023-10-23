const express = require('express');
const app = express();
const path = require('path');

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Define a route to handle video file requests
app.get('/videos/:videoName', (req, res) => {
  const videoName = req.params.videoName;
  const videoPath = path.join(__dirname, 'public', videoName);
  res.sendFile(videoPath);
});

// Start the server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

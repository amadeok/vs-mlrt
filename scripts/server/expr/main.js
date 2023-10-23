const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs')
// Define the directory where your files are located
const filesDirectory = path.join(__dirname, 'files');

// Serve static files from the 'files' directory
app.use('/files', express.static(filesDirectory));

// Route to handle file downloads
app.get('/download/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(filesDirectory, fileName);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Set the appropriate headers for the response
    res.setHeader('Content-disposition', 'attachment; filename=' + fileName);
    res.setHeader('Content-type', 'application/octet-stream');

    // Create a read stream from the file and pipe it to the response object
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    // If the file does not exist, send a 404 response
    res.status(404).send('File not found');
  }
});

// Start the server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

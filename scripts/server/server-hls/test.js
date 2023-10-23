const fs = require('fs');

const filePath = '/home/amadeok/vs-mlrt/scripts/server/server-hls/public/stream/str0000.ts';

// fs.watch(filePath, (eventType, filename) => {
//   if (filename) {
//     console.log(`File ${filename} changed`);
//   } else {
//     console.log(`File accessed`);
//   }
// });

// Replace 'path/to/your/file.txt' with the actual path to your file

function printLastAccessTime() {
  fs.stat(filePath, (err, stats) => {
    if (err) {
      console.error('Error occurred while getting file stats:', err);
      return;
    }

    const lastAccessedTime = stats.atime; // Access time of the file
    console.log('Last accessed time:', lastAccessedTime);
  });
}

// Print last accessed time every second
setInterval(printLastAccessTime, 1000);


console.log("hgello")
from flask import Flask, send_from_directory, render_template
import os

app = Flask(__name__)

# Specify the directory where your video files are stored
VIDEO_DIRECTORY = "stream"

@app.route('/s/<filename>')
def serve_video(filename):
    # Get the absolute path of the video file
    video_path = os.path.join(VIDEO_DIRECTORY, filename)
    # Serve the video file
    return send_from_directory(os.path.abspath(VIDEO_DIRECTORY), filename)


@app.route('/')
def home():
   return render_template('i6.html')

if __name__ == '__main__':
    # Run the Flask app on port 5000
    app.run(host='192.168.1.160', port=5000)

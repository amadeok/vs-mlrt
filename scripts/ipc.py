import requests
import json
#echo show-text ${playback-time} >\\.\pipe\mpvpipe
#echo show-text ${playback-time} >\\.\pipe\mpvpipe
#echo cycle pause > \\.\pipe\mpvpipe
#echo set volume 50 > \\.\pipe\mpvpipe
#echo seek 10 exact > \\.\pipe\mpvpipe
#echo loadfile "C:\path\to\your\video.mp4" > \\.\pipe\mpvpipe
#echo show-text "Hello, MPV!" > \\.\pipe\mpvpipe

import win32file  # This module provides access to Windows named pipes

# Specify the desired time in seconds
desired_time_in_seconds = 60  # Replace this with your desired time

# Construct the JSON message
json_data = {
    "command": ["set_property", "time-pos", desired_time_in_seconds]
}

json_data = {
    "command": ["show-text", "playback-time"]
}
# Convert the JSON data to a string
json_string = json.dumps(json_data)
json_string = b"show-text ${playback-time} "

# Connect to the named pipe (mpv IPC server)
pipe_path = r'\\.\pipe\mpvpipe'
ret = pipe_handle = win32file.CreateFile(
    pipe_path,
    win32file.GENERIC_WRITE,
    0,
    None,
    win32file.OPEN_EXISTING,
    0,
    None
)
print(ret) 
# Send the JSON message to mpv using IPCb
#bys = json_string.encode('utf-8')
ret = win32file.WriteFile(pipe_handle, json_string)
print(ret)
# Close the named pipe after sending the message
print(win32file.CloseHandle(pipe_handle))
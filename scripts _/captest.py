import os
import time
import keyboard


from pymediainfo import MediaInfo

f = r'https://rr1---sn-uxaxpu5ap5-jp5l.googlevideo.com/videoplayback?expire=1706475419&ei=O2u2ZabGBb-wi9oPveC3-AY&ip=87.19.65.221&id=o-AD83y0LlVwJxXl3h2xz9E1zPXRn4i6R4nzpbCJAvjYSj&itag=303&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&mh=z5&mm=31%2C29&mn=sn-uxaxpu5ap5-jp5l%2Csn-hpa7zns6&ms=au%2Crdu&mv=m&mvi=1&pl=24&initcwndbps=1408750&vprv=1&svpuc=1&mime=video%2Fwebm&gir=yes&clen=93107012&dur=804.383&lmt=1706437581949887&mt=1706453609&fvip=5&keepalive=yes&fexp=24007246&c=IOS&txp=5535434&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cvprv%2Csvpuc%2Cmime%2Cgir%2Cclen%2Cdur%2Clmt&sig=AJfQdSswRQIgGcIMtFuEEC-8vCi_rb0TmwrgLkCMmcbFT5BuqZdFynUCIQCuxI0FBF8D1GWJ1e8GWfkRLSJbxyF_OPIjionvYE85pA%3D%3D&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Cinitcwndbps&lsig=AAO5W4owRQIhAPELz_XSykgkek__l8daap0H1wtTUhoSTmqN35DkEcTiAiBFEZYppd_Kq_7R3uQo57SG1blSvRq0hFStuJP3nlxWDA%3D%3D'
media_info = MediaInfo.parse(f)






import vapoursynth
from vapoursynth import core
print(core.version())
while True:
    print("pressed")
    keyboard.press_and_release('space')
    time.sleep(60)
    
import yt_dlp

def get_resolution(video_url, stream_index=0):
    ydl_opts = {
        'format': 'best',
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(video_url, download=False)
        streams = info_dict.get('formats', []) + info_dict.get('entries', [])

        if streams and 0 <= stream_index < len(streams):
            stream = streams[stream_index]
            resolution = stream.get('height', 'N/A')
            return resolution
        else:
            return 'Stream index out of range or no streams available.'

# Example usage:
video_url = r"https://au-d1-01.scws-content.net/download/3/8/1d/81d4aa5d-3189-453b-9a1c-5aaeb400c434/720p.mp4?token=E6CT_1UHSJ_1N0PaMwpbAw&expires=1705173582&filename=UmaMusumePrettyDerbyRoadToTheTop_ONA_01_SUB_ITA.mp4"
resolution = get_resolution(video_url)
print(f'Resolution: {resolution}')







v = 18446744073709551615


import win32pipe
import win32file



import cv2
import sys, numpy as np
empty_image = np.zeros((100, 100, 3), dtype=np.uint8)

cv2.imshow("sys.argv[1]", empty_image)
while 1:
    res = cv2.waitKey(0)
    print('You pressed %d (0x%x), LSB: %d (%s)' % (res, res, res % 256,
        repr(chr(res%256)) if res%256 < 128 else '?'))





# Specify the path to the named pipe
pipe_path = r"\\.\pipe\rife_player_mpv_lua_pipe"

# Create the named pipe
pipe = win32pipe.CreateNamedPipe(
    pipe_path,
    win32pipe.PIPE_ACCESS_DUPLEX,
    win32pipe.PIPE_TYPE_MESSAGE | win32pipe.PIPE_READMODE_MESSAGE | win32pipe.PIPE_WAIT,
    1,  # Number of instances
    65536,  # Out buffer size
    65536,  # In buffer size
    0,  # Default timeout
    None  # Security attributes
)

if pipe:
    print(f"Named pipe '{pipe_path}' created successfully.")

    # Wait for a client to connect
    win32pipe.ConnectNamedPipe(pipe, None)

    try:
        # Read data from the named pipe
        data = win32file.ReadFile(pipe, 4096, None)
        print(f"Received data: {data[1]}")
        msg = data[1] + b"sent back"
        size_ =  len(msg).to_bytes(2, "big")
        win32file.WriteFile(pipe, size_)
        win32file.WriteFile(pipe, msg)
    except Exception as e:
        print(f"Error reading from the named pipe: {e}")
    finally:
        # Close the named pipe
        win32file.CloseHandle(pipe)
else:
    print(f"Failed to create named pipe '{pipe_path}'.")








#v = 720
secs = v/(24000/1001)
mins = secs / 60
hrs = mins / 60

print(format(secs, '.8f'), format(mins, '.8f'), format(hrs, '.8f'))

import socket


def client_program():
    host = "DESKTOP-IA7K3U12"#socket.gethostname()  # as both code is running on same pc
    port = 5000  # socket server port number
  

    message = input(" -> ")  # take input

    while message.lower().strip() != 'bye':
        client_socket.send(message.encode())  # send message
        data = client_socket.recv(1024).decode()  # receive response

        print('Received from server: ' + data)  # show in terminal

        message = input(" -> ")  # again take input

    client_socket.close()  # close the connection


if __name__ == '__main__':
    client_program()











import random
class mbuf:
    def __init__(s, index) -> None:
        s.dif = 0
        s.pts = 0
        s.index = index
        s.framen = index
        s.repeated = 0
        pass
    def __str__(s) -> str:
        return f"i {s.index:2} fn {s.framen:2} rp {s.repeated}"
    def __repr__(s) -> str:
        return f"i {s.index:2} fn {s.framen:2} rp {s.repeated}"


#arr = [mbuf() for i in range(144)]
r = 4 #random.randrange(1, 4)

arr = [mbuf(i+r) for i in range(10)]

arr[0].repeated = 1
arr[3].repeated = 2
arr[1].repeated = 1
arr[5].repeated = 3

count = arr[0].framen 

for i, b in  enumerate(arr):
    pb = arr[i-1]
    count+= pb.repeated
    b.framen = count
    count+=1
for elem in arr:
    print(elem)  
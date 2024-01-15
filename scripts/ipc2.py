import os, win32pipe, win32api,  win32file, pywintypes, time
import winerror


# Replace this with the actual pipe name
pipe_name = r'\\.\pipe\mpvsocketr2'

# # Check if the pipe exists
# if not os.path.exists(pipe_name):
#     # Create the named pipe
#    fd0 =  win32pipe.CreateNamedPipe(
#         pipe_name,
#         win32pipe.PIPE_ACCESS_DUPLEX,
#         win32pipe.PIPE_TYPE_MESSAGE | win32pipe.PIPE_READMODE_MESSAGE | win32pipe.PIPE_WAIT,
#         1,  # Maximum number of instances
#         65536,  # Out buffer size
#         65536,  # In buffer size
#         0,  # Timeout (0 means blocking)
#         None  # Security attributes
#     )
#    print(fd0)
# ret = win32pipe.ConnectNamedPipe(fd0, None)
# if ret != 0:
#     print("error fd0", win32api.GetLastError())
# Connect to the named pipe
#pipe = open(ret, 'w')
# pipe = win32file.CreateFile(
#     pipe_name,
#     win32file.GENERIC_WRITE,
#     0,  # No sharing
#     None,
#     win32file.OPEN_EXISTING,
#     0,
#     None
# )
# Send a command to MPV



class pipe_comms:
    def __init__(self):
        self.pipe_open = False
        self.pipe_handle = None
        self.pipe_name = r'\\.\pipe\mpvsocketr2'

        self.read_msg = None
        self.overlapped = None
        self.read_buf = win32file.AllocateReadBuffer(4096)

    def connect(self):
        if not self.pipe_open:
            try:
                self.pipe_handle = win32file.CreateFile(self.pipe_name,
                    win32file.GENERIC_READ | win32file.GENERIC_WRITE,
                    0, None, win32file.OPEN_EXISTING,
                    win32file.FILE_FLAG_OVERLAPPED, None)
                win32pipe.SetNamedPipeHandleState(self.pipe_handle, 
                    win32pipe.PIPE_READMODE_MESSAGE, None, None)
                self.pipe_open = True
                self.read_msg = None
            except pywintypes.error as e:
                self.handle_error(e.args[0])
                return False
        return True

    def receive(self):
        try:
            result = self.receive_overlapped()
            if result == winerror.ERROR_SUCCESS:
                fullMsg = self.read_msg
                self.read_msg = None
                return fullMsg
            elif result == winerror.ERROR_IO_PENDING:
                print("ERROR_IO_PENDING")
                return None
            else:
                self.handle_error(result)
        except pywintypes.error as e:
            self.handle_error(e.args[0])
            return None

    def receive_overlapped(self):
        if self.overlapped:
            try:
                bytes_read = win32file.GetOverlappedResult(self.pipe_handle, self.overlapped, 0)
                self.read_msg += bytes(self.read_buf[:bytes_read])
                self.overlapped = None
                return winerror.ERROR_SUCCESS
            except pywintypes.error as e:
                result = e.args[0]
                if result == winerror.ERROR_MORE_DATA:
                    bytes_read = len(self.read_buf)
                    self.read_msg += bytes(self.read_buf[:bytes_read])
                    # fall thru to issue new ReadFile
                else:
                    # ERROR_IO_PENDING is normal, anything else is not
                    return result 
        else:
            self.read_msg = bytes()
            self.overlapped = pywintypes.OVERLAPPED()

        result, data = win32file.ReadFile(self.pipe_handle, self.read_buf, self.overlapped)
        while True:
            if result == winerror.ERROR_MORE_DATA:
                bytes_read = len(data)
                self.read_msg = bytes(data[:bytes_read])
                result, data = win32file.ReadFile(self.pipe_handle, self.read_buf, self.overlapped)
                continue
            elif result == winerror.ERROR_SUCCESS:
                bytes_read = win32file.GetOverlappedResult(self.pipe_handle, self.overlapped, 0)
                self.read_msg = bytes(data[:bytes_read])
                self.overlapped = None
            return result

    def handle_error(self, result):
        reset_pipe = False
        if result == winerror.ERROR_BROKEN_PIPE:
            win32pipe.DisconnectNamedPipe(self.pipe_handle)
            reset_pipe = True
        elif result == winerror.ERROR_NO_DATA:
            reset_pipe = True
            
        if reset_pipe:
            self.pipe_handle = None
            self.pipe_open = False
            self.read_msg = None
            self.overlapped = None



con = pipe_comms()
print(con.connect())

def connect():
    quit = 0
    while not quit:
        try:
            fd1 = win32file.CreateFile( pipe_name, win32file.GENERIC_READ | win32file.GENERIC_WRITE,  0,  None, win32file.CREATE_NEW,  0,  None)
            #res = win32pipe.SetNamedPipeHandleState(fd1, win32pipe.PIPE_READMODE_MESSAGE, None, None)
            
        except pywintypes.error as e:
            if e.args[0] == 2:
                print("No Input pipe, trying again in a sec")
                time.sleep(1)
            continue
        quit = 1
    print(f"Python Input pipe opened")
    return fd1

#fd1 = connect()
command = '{"command": ["set_property", "pause", true]}\n'
command = '{"command": ["cycle", "pause"]}\n'
command = '{"command": ["get_property", "media-title"]}\n'
command = '{ "command": ["set_property", "test_prop", "23"]}\n'
command = '{ "command": ["get_property", "test_prop"]}\n'

command =  '{ "command": ["get_property", "script-opts"] }\n' 
command =  '{ "command": ["quit"] }\n' 
command =  '{ "command": ["get_property", "height"] }\n' 
command =  '{ "command": ["set_property", "playback-time", "0"] }\n' 

b = bytes(command, 'utf-8')
ret = win32file.WriteFile(con.pipe_handle, b )
#ret = con.receive_overlapped()
while not con.read_msg:
    print("attempt")
    ret = con.receive_overlapped() 
    time.sleep(0.1)
print(ret, con.read_msg)

#pipe.write(command)
#pipe.flush()

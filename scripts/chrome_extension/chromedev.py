
import http.server
import socketserver
import json
import socket


import socket, time











import asyncio
import websockets

async def handle_connection(websocket, path):
    print(f"Client connected from {websocket.remote_address}")

    try:
        # Wait for data from the client
        message = await websocket.recv()
        print(f"Received message from client: {message}")

        # Send a response back to the client
        response = "Hello, client!"
        await websocket.send(response)
        print(f"Sent response to client: {response}")

    finally:
        # Close the connection
        await websocket.close()
        print(f"Connection with {websocket.remote_address} closed")

if __name__ == "__main__":
    # Set the server address and port
    server_address = "127.0.0.1"
    server_port = 65432

    # Start the WebSocket server
    start_server = websockets.serve(handle_connection, server_address, server_port)

    print(f"Server running on ws://{server_address}:{server_port}")

    # Run the server until it's manually stopped
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()

    

HOST = "127.0.0.1"  # Standard loopback interface address (localhost)
PORT = 65432  # Port to listen on (non-privileged ports are > 1023)

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind((HOST, PORT))
    s.listen()
    conn, addr = s.accept()
    with conn:
        print(f"Connected by {addr}")
        while True:
            ret = conn.send(b'test')
            print("RET ", ret)
            time.sleep(1)

            data = conn.recv(4)
            print("data rect", data)
            time.sleep(1)
            if not data or 1:
                time.sleep(10)
            conn.sendall(data)

PORT = 8000
exit()
class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            with open('index.html', 'rb') as f:
                self.copyfile(f, self.wfile)
        else:
            # Handle other endpoints or return a 404 response
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')

# Create a WebSocket server
class WebSocketServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True

class WebSocketHandler(socketserver.BaseRequestHandler):
    def handle(self):
        print("WebSocket connection established")
        data = self.request.recv(1024)
        self.send_websocket_response(data)

    def send_websocket_response(self, message):
        response = {
            'message': 'This is a WebSocket response.',
            'data': message.decode('utf-8')
        }
        json_response = json.dumps(response).encode('utf-8')

        # Sending a WebSocket frame with the response
        frame = bytearray([0x81, len(json_response)])
        frame.extend(json_response)
        self.request.sendall(frame)

# Set up WebSocket server
websocket_server = WebSocketServer(('localhost', 8001), WebSocketHandler)

if __name__ == "__main__":
    print(f"Serving at port {PORT}")
    server = http.server.ThreadingHTTPServer(('localhost', PORT), MyHandler)
    
    # Start the server in a separate thread
    # server_thread = socketserver.ThreadingTCPServer(('localhost', PORT), MyHandler)
    # server_thread.daemon = True
    #server_thread.start()

    # Start the WebSocket server in another thread
    # websocket_thread = socketserver.ThreadingTCPServer(('localhost', 8001), WebSocketHandler)
    # websocket_thread.daemon = True
    # #websocket_thread.start()

    # Wait for the user to interrupt with Ctrl+C
    # try:
    #     server_thread.join()
    # except KeyboardInterrupt:
    #     pass

    # # Clean up
    # server.server_close()
    # websocket_thread.server_close()










PORT = 8000

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            with open('index.html', 'rb') as f:
                self.copyfile(f, self.wfile)
        elif self.path == '/api/data':
            # Respond with JSON data for /api/data endpoint
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            data = {'message': 'This is JSON data from the server.'}
            self.wfile.write(json.dumps(data).encode('utf-8'))
        else:
            # Handle other endpoints or return a 404 response
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')

Handler = MyHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()



import requests
import json

# Replace 'http://localhost:9222' with the actual endpoint of your running Chrome instance
chrome_endpoint = 'http://localhost:9222'

# Get the list of available tabs
tabs_url = f'{chrome_endpoint}/json'
response = requests.get(tabs_url)
tabs = json.loads(response.text)

# Choose a tab (you can select the first tab by default)
tab_url = tabs[0]['webSocketDebuggerUrl']

# Connect to the chosen tab
ws_url = tab_url.replace('ws://', 'http://')
response = requests.get(ws_url)
ws_url = response.text

# Example: Send a simple command to the Chrome tab
command_url = f'{ws_url}/session/{tabs[0]["id"]}/chromium/send_command'
command_body = {
    'cmd': 'Browser.getVersion',
}

response = requests.post(command_url, json=command_body)
result = json.loads(response.text)

print(result)
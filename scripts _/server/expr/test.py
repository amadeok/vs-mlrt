from http.server import SimpleHTTPRequestHandler, HTTPServer

# Dictionary to store downloaded files and their download counts
downloaded_files = {}

class CustomRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        # Log the downloaded file
        file_path = self.path.strip('/')
        if file_path not in downloaded_files:
            downloaded_files[file_path] = 1
        else:
            downloaded_files[file_path] += 1
        
        # Call the parent class method to handle the request
        super().do_GET()

# Define the server address and port
server_address = ('192.168.1.160', 8000)

# Create the HTTP server with the custom request handler
httpd = HTTPServer(server_address, CustomRequestHandler)

print('Server started on port 8000...')
print('Press Ctrl+C to stop the server.')

# Start the server
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    # Handle Ctrl+C to stop the server
    print('Server stopped.')
    httpd.shutdown()
    httpd.server_close()

# Print downloaded files and their download counts when the server is stopped
print('Downloaded files and their download counts:')
for file, count in downloaded_files.items():
    print(f'{file}: {count} download(s)')

import http.server
import socketserver

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer( ('192.168.1.160', 8000), Handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()

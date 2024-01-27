import asyncio
import websockets

async def connect_to_server():
    uri = "ws://127.0.0.1:65432"

    async with websockets.connect(uri) as websocket:
        print(f"Connected to server at {uri}")

        # Send a message to the server
        message = "Hello, server!"
        await websocket.send(message)
        print(f"Sent message to server: {message}")

        # Receive a response from the server
        response = await websocket.recv()
        print(f"Received response from server: {response}")

if __name__ == "__main__":
    asyncio.get_event_loop().run_until_complete(connect_to_server())

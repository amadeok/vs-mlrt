v = 18446744073709551615

#v = 720
secs = v/(24000/1001)
mins = secs / 60
hrs = mins / 60

print(format(secs, '.8f'), format(mins, '.8f'), format(hrs, '.8f'))
import keyboard
import time

while True:
    print("pressed")
    keyboard.press_and_release('space')
    time.sleep(10)


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
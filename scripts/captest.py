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
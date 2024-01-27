import shutil
dict = {"/": "client.html", "/style": "style.css", "/clientjs": "client.js" , "/client_utils": "client_utils.js", "/remote": "remote.html", "/remotejs": "remote.js" }
n = 0
for key, value in dict.items():
    shutil.copy("src/"+ value, f"src/{n}.bin")
    print(key, value)
    n+=1
@echo off
set zip_file="data.bin"
set file1="client.html"
set file2="client.js"
set file3="remote.html"
set file4="remote.js"
set file5="style.css"
set file6="client_utils.js"
set file7="F:\all\GitHub\vs-mlrt\scripts _\int.py"
"E:\Users\amade\rifef _\python-3.11.7\7z.exe" a -tzip %zip_file% %file1% %file2% %file3% %file4% %file5% %file6% %file7%

del server.exe
del sea-prep.blob
call npm run build
echo { "main": "server-out.js", "output": "sea-prep.blob" } > sea-config.json
node --experimental-sea-config sea-config.json
node -e "require('fs').copyFileSync(process.execPath, 'server.exe')"
npx postject server.exe NODE_SEA_BLOB sea-prep.blob ^ --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 

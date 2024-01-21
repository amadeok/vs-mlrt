@echo off

del server.exe
del sea-prep.blob
call npm run build
echo { "main": "server-out.js", "output": "sea-prep.blob" } > sea-config.json
node --experimental-sea-config sea-config.json
node -e "require('fs').copyFileSync(process.execPath, 'server.exe')"
npx postject server.exe NODE_SEA_BLOB sea-prep.blob ^ --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 
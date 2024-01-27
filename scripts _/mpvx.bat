@echo off
set PATH=C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\bin;C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\libnvvp;C:\WinAVR-20100110\bin;C:\WinAVR-20100110\utils\bin;C:\Program Files (x86)\VMware\VMware Player\bin\;C:\Program Files\Oculus\Support\oculus-runtime;C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Windows\System32\WindowsPowerShell\v1.0\;C:\Windows\System32\OpenSSH\;C:\Program Files (x86)\NVIDIA Corporation\PhysX\Common;C:\Program Files\NVIDIA Corporation\NVIDIA NvDLISR;C:\Program Files\Mullvad VPN\resources;C:\Program Files\Csound6_x64\bin;C:\Program Files\nodejs\;C:\Program Files\Git\cmd;E:\Users\amade\ffmpeg-5.1.1-essentials_build\bin;C:\Program Files\dotnet\;E:\msys64\mingw64\bin;C:\opencv\opencv\build\x64\vc16\bin;C:\Users\amade\Downloads\libusb-1.0.26-binaries\VS2015-x64\dll;C:\Program Files\CMake\bin;C:\Program Files\NVIDIA Corporation\Nsight Compute 2023.2.2\;C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\lib\x64;C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\include;C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\bin;C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\lib;C:\cudnn-windows-x86_64-8.5.0.96_cuda11-archive\bin;C:\TensorRT-8.5.1.7\lib;C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\lib;C:\Program Files\NVIDIA Corporation\Nsight Compute 2022.3.0\;C:\SFML-2.6.0\bin;C:\Program Files\PuTTY\;

set "original_path=%PATH%"

rem Remove unwanted directory from PATH using setx
rem setx PATH "%PATH:C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\bin;=%"


set PATH=C:\Windows\system32;C:\Windows;


set "unwanted_directories=\"E:\Users\amade\ffmpeg-5.1.1-essentials_build\bin\\";\"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\libnvvp\";\"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\lib\x64\";\"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\include\";\"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\bin\";\"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\lib\";\"C:\cudnn-windows-x86_64-8.5.0.96_cuda11-archive\bin\";\"C:\TensorRT-8.5.1.7\lib\";\"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\lib\""
rem set "unwanted_directories=\"C:\unwanted directory 1\";\"C:\unwanted directory 2\";\"C:\unwanted directory 3\""

set PATH=%PATH:\"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\lib\";=%


echo -----------------------------------------------------
echo %original_path%
echo -----------------------------------------------------
echo -----------------------------------------------------
echo %PATH%
echo -----------------------------------------------------

rem C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\bin
mpv_.com --vf="vapoursynth:[F:\all\GitHub\vs-mlrt\scripts\test3.py]":4:8 D:\1.mkv  --profile=dev %*

rem Restore the original PATH variable
setx PATH "%original_path%"

rem Optional: Display a message indicating the completion of the script
echo Program executed. PATH variable restored.

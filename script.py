# import sounddevice as sd
# import numpy as np
# import scipy.io.wavfile as wav
 
import vapoursynth as vs
from vapoursynth import core
import os, sys, win32gui
# import numpy as np, sys, os
# import cv2
# from mss import mss
#sys.path.append(r"E:\Users\amade\rifef\ffmpeg-n6.0-latest-win64-gpl-shared-6.0\bin")
# Initialize VapourSynth core
#core = vs.core
# vs.core.std.LoadPlugin(r"F:\all\GitHub\vsrawsource\rawsource.dll")
p =  r"e:\Users\amade\rifef\ffms2-2.40-msvc\x64\ffms2.dll"
vs.core.std.LoadPlugin(p)

from ctypes import*
sys.path.append(r"E:\Users\amade\rifef\ffmpeg-n6.0-latest-win64-gpl-shared-6.0\bin")
sys.path.append("F:\\all\\GitHub\\bestsource\\msvc\\x64\\Release\\")
bsp = "F:\\all\\GitHub\\bestsource\\msvc\\x64\\Release\\BestSource.dll"

print(core.version())
#mydll = cdll.LoadLibrary(bsp)
assert(os.path.isfile(bsp))

vs.core.std.LoadPlugin(r"E:\Users\amade\rifef\bas-r1\win64\BestAudioSource.dll")
# try:    vs.core.std.LoadPlugin(bsp)
# except Exception as e :     print("error", e);    input();
#clip = core.raws.Source(r'\\.\pipe\audio_pipeOut')
# #cc.std.LoadPlugin("../libdamb.so")
# cc.bas
audio_file = r"C:\Users\amade\Documents\dawd\lofi1\lofi\Mixdown\v3\00015v3.mp3"
video_f = r"D:\soft\media\skate\[AnimeOut] SK8 the Infinity - 01 720pp [CE18EFAA][SubsPlease][RapidBot].mkv"
#video = core.ffms2.Source(r"D:\soft\media\skate\[AnimeOut] SK8 the Infinity - 01 720pp [CE18EFAA][SubsPlease][RapidBot].mkv")
audio = vs.core.bas.Source(audio_file, track=-1)

#video = vs.core.std.BlankClip()
#video.set_output(0)
audio.set_output(1)
# 
# 
# from vapoursynth import core
# video = core.bs.VideoSource(source=video_f)
# audio = core.bs.AudioSource(source=audio_file)
# video = core.std.FlipHorizontal(video)
# audio = core.std.AudioGain(audio,gain=2.0)
# video.set_output(index=0)
# audio.set_output(index=1)
import sys
sys.path.append("/home/amadeok/vs-mlrt/scripts/")
import random
from vsmlrt import RIFE, RIFEModel, Backend
import vapoursynth as vs, os, numpy as np, cv2, ctypes, time
core = vs.core
#src = core.std.BlankClip(format=vs.RGBS)

import vapoursynth as vs
core = vs.core
video_file_path = "/home/amadeok/Downloads/Demon Slayer (Kimetsu no Yaiba) [KaiDubs] [AS] [CC] [720p]/Demon Slayer - 01 - Cruelty [KaiDubs] [720p].mp4"
try:
  core.std.LoadPlugin(path="/usr/lib/x86_64-linux-gnu/libffms2.so")
except Exception as e:
  print(e)
print("\n----\n ", dir(core), "\n----------\n", dir(core.ffms2), "\n------------------")
print(os.path.isfile(video_file_path))
core.num_threads =1
print(core.num_threads)


#clip  = core.ffms2.Source(video_file_path)
clip = video_in
rgb = core.resize.Bicubic(clip=clip,   format=vs.RGB24, matrix_in_s="709", transfer_in_s="709", width=1280, height=704 )
generator = rgb.frames()
print(rgb.format)

# clip_rgbh = rgb.std.SetFrameProp(prop="_FieldBased", intval=1)
# clip_rgbh = rgb.resize.Point(format=vs.RGBH, matrix_in_s="709", matrix_s="709")
clip_rgbh = core.resize.Bicubic(clip=clip, format=vs.RGBS, matrix_in_s="709", transfer_in_s="709", width=1280, height=704  )

print(clip_rgbh.format)

# backend could be:
#  - CPU Backend.OV_CPU(): the recommended CPU backend; generally faster than ORT-CPU.
#  - CPU Backend.ORT_CPU(num_streams=1, verbosity=2): vs-ort cpu backend.
#  - GPU Backend.ORT_CUDA(device_id=0, cudnn_benchmark=True, num_streams=1, verbosity=2)
#     - use device_id to select device
#     - set cudnn_benchmark=False to reduce script reload latency when debugging, but with slight throughput performance penalty.
#  - GPU Backend.TRT(fp16=True, device_id=0, num_streams=1): TensorRT runtime, the fastest NV GPU runtime.
model = RIFEModel.v4_6
multi =2
#model = "/home/amadeok/vs-mlrt/vstrt/build/models/rife/72f.engine"
flt = RIFE(clip_rgbh, model=model, backend=Backend.TRT(), multi=multi)
print("rife")
final = core.resize.Bicubic(flt,  format=vs.YUV444P16,  filter_param_a=1, filter_param_b=0)
# rgb2 = core.resize.Bicubic(clip=flt,   format=vs.RGB24, matrix_in_s="709", transfer_in_s="709", width=1280, height=704 )
# gen = rgb2.frames()

# ind = 1200 * 5/2
print(dir(final))
# pt = 0; ct = 0;
print("smooth")
#smooth = rgb2.resize.Point(format=vs.YUV420P8)

final.set_output()

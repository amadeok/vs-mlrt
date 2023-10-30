print ("hgello")

import sys; sys.path += ["/home/amadeok/vs-mlrt/scripts/","/content/mlrt/vs-mlrt/scripts",r"F:\all\GitHub\vs-mlrt\scripts\\"]
import time, vapoursynth as vs, fractions
from vsmlrt import RIFE, RIFEModel, Backend
def mult32(number):  return  ((number + 31) // 32) * 32
tw = 1280; th =720; autoscale = False
def getW(): return  mult32(tw) if autoscale  else mult32(video_in_dw)
def getH(): return mult32(th) if autoscale else mult32(video_in_dh)
cMatrix = '709'
cRange = 'limited'
core = vs.core
clip = video_in

try:core.std.LoadPlugin("/content/drive/MyDrive/rifef/libmiscfilters.so") #/content/vs-miscfilters-obsolete/build
except Exception as e: print(e)
#clip = core.misc.SCDetect(clip=clip,threshold=sceneDetectionThreshold)

try:
    cFormat = eval('vs.' + clip.format.name)
except:
    cFormat = vs.YUV420P8

try:
    cFamily = str(clip.format.color_family)
except:
    cFamily = 'ColorFamily.YUV'

#print("-----> clip bps1 ", clip[0].format.bits_per_sample )

# if cFamily == 'ColorFamily.RGB':
#   clip = core.resize.Bicubic(clip, format=vs.RGBS, range_in_s=cRange, filter_param_a=1, filter_param_b=0, width=mult32(getW()), height=mult32(getH()))
# else:
#   clip = core.resize.Bicubic(clip, format=vs.RGBS, matrix_in_s=cMatrix, range_in_s=cRange, filter_param_a=1, filter_param_b=0, width=mult32(getW()), height=mult32(getH()))

new_width = (video_in_dw // 32) * 32
new_height = (video_in_dh // 32) * 32

left = (video_in_dw - new_width) / 2
right = left
top = (video_in_dh - new_height) / 2
bottom = top
print( left, right, top, bottom)
clip = vs.core.std.CropRel(clip, left, right, top, bottom)
clip = clip.resize.Bicubic(format=vs.RGBH,matrix_in_s="709") #RGBH for 16 bit per sample output
#print("-----> clip bps2 ", clip[0].format.bits_per_sample )

trt_backend = Backend.TRT(fp16=True,device_id=0,num_streams=2,output_format=1,use_cuda_graph=True,workspace=None,static_shape=False,min_shapes=[64,64],max_shapes=[2560,1440])
clip = RIFE(clip,model=RIFEModel.v4_6, backend=trt_backend, multi=2)
#print("output")

clip = core.resize.Bicubic(clip, width=getW(), height=getH(), format=vs.YUV420P8, matrix_s=cMatrix, range_s=cRange, filter_param_a=1, filter_param_b=0)
  
# fps_fraction = fractions.Fraction(container_fps * interpMulti).limit_denominator()
# output_num, output_den = fps_fraction.numerator, fps_fraction.denominator
#clip = core.std.AssumeFPS(clip, fpsnum=output_num, fpsden=output_den) GIVES WRONG FPS ON COLAB

# output to mpv

clip.set_output()

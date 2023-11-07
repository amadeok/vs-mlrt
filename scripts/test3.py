
import sys; sys.path += ["/home/amadeok/vs-mlrt/scripts/","/content/mlrt/vs-mlrt/scripts",r"F:\all\GitHub\vs-mlrt\scripts\\"]
import time, vapoursynth as vs, fractions, configparser, os
from vsmlrt import RIFE, RIFEModel, Backend
def mult32(number):  return  ((number + 31) // 32) * 32
tw = 1280; th =720; autoscale = False

RIFEF_CONFIG_FILE = os.getenv("RIFEF_CONFIG_FILE")
if not RIFEF_CONFIG_FILE: RIFEF_CONFIG_FILE = r"F:\all\GitHub\vs-mlrt\scripts\server\express-hls-example\src\config.ini"
print("RIFEF_CONFIG_FILE: ", RIFEF_CONFIG_FILE)
assert(os.path.isfile(RIFEF_CONFIG_FILE))
config = configparser.ConfigParser()
ret = config.read(RIFEF_CONFIG_FILE)

multiplier = int(config["main"]["multiplier"])

def getW(): return  mult32(tw) if autoscale  else mult32(video_in_dw)
def getH(): return mult32(th) if autoscale else mult32(video_in_dh)
cMatrix = '709'
cRange = 'limited'
core = vs.core
multiplier = 2

RIFEF_CONFIG_FILE = os.getenv("RIFEF_CONFIG_FILE")
config = configparser.ConfigParser()

if RIFEF_CONFIG_FILE:
    config.read(RIFEF_CONFIG_FILE)
    try:
        multiplier = int(config["main"]["multiplier"])
    except Exception as e:
        print("Config file doesn't have 'multiplier' option, defaulting to ", multiplier)
else:
    print("CONFIG FILE MISSING ")

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

# new_width = (video_in_dw // 32) * 32
# new_height = (video_in_dh // 32) * 32

# left = (video_in_dw - new_width)
# right = left
# top = (video_in_dh - new_height)
# bottom = top
#print( left, right, top, bottom," before cropRel")
#clip = vs.core.std.CropRel(clip, left, right, top, bottom) #this fails sometimes
#clip = vs.core.std.CropAbs(clip, left=0, top=0, width=new_width, height=new_height)

print("test3 before bicubic")
clip = clip.resize.Bicubic(format=vs.RGBH,matrix_in_s="709") #RGBH for 16 bit per sample output
#print("-----> clip bps2 ", clip[0].format.bits_per_sample )
print("test3 before backend")
trt_backend = Backend.TRT(fp16=True,device_id=0,num_streams=2,output_format=1,use_cuda_graph=True,workspace=None)
#trt_backend = Backend.TRT(fp16=True,device_id=0,num_streams=2,output_format=1,use_cuda_graph=True,workspace=None,static_shape=False,min_shapes=[64,64],max_shapes=[2560,1440])
print("test3 before rife")

clip = RIFE(clip,model=RIFEModel.v4_6, backend=trt_backend, multi=multiplier)
#print("output")

print("test3 after rife")
fps = 24000/1001
try:
    fps =  float(container_fps)*multiplier
except:
    pass

clip = core.resize.Bicubic(clip,  format=vs.YUV420P8, matrix_s=cMatrix, range_s=cRange, filter_param_a=1, filter_param_b=0) #width=getW(), height=getH(),

#clip = vs.core.std.AddBorders(clip,  right=left, bottom=top )  
fps_fraction = fractions.Fraction(container_fps * multiplier).limit_denominator()
output_num, output_den = fps_fraction.numerator, fps_fraction.denominator

print("NEW FRAMERATE", container_fps, " -> ",  fps, " : ", output_num,  "/", output_den)

#clip = core.std.AssumeFPS(clip, fpsnum=output_num, fpsden=output_den)
#clip = core.std.AssumeFPS(clip, fpsnum=output_num, fpsden=output_den) GIVES WRONG FPS ON COLAB

# output to mpv
print("set_output")

clip.set_output()

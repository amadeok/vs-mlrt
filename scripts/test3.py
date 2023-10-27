

## Realtime RIFE interpolation script for MPV based on rife-ncnn-vulkan ##
import sys
sys.path.append("/home/amadeok/vs-mlrt/scripts/")
sys.path.append("/content/mlrt/vs-mlrt/scripts")

interpMulti             = 2          # Framerate multiplier
interpModel             = 21         # Recommended 9 = rife-v4(supports over 2x multi) 5 = rife-2.3(higher quality only supports 2x)
gpuThread               = 2          # GPU Thread count for interpolation
gpuId                   = None       # GPU device to use
TTA                     = False      # Enable TTA(Test-Time Augmentation) mode
UHD                     = False      # Changes opticalflow resolution scale to 0.5 can have a positive or negative effect on interpolation quality
sceneDetection          = True       # Turn off interpolation for scenechanges to avoid warping
sceneDetectionThreshold = 0.36       # lower is more sensitive
SKIP                    = True      # don't interpolate duplicate frames to save performance
skipThreshold           = 52         # frame simularity threshold
autoScale               = False       # Automatic downscaling to maintain performance
ScaleSteps              = 0.200      # downscaling step percentage
autoScaleInteger        = False      # Not recommended integer only often results in much lower downscaled resolutions
maxIpps                 = 20000000   # Max interpolated pixels per second the GPU is capable of 
osdInfo                 = False      # Display OSD info

cMatrix = '709'
cRange = 'limited'
from vsmlrt import RIFE, RIFEModel, Backend

import vapoursynth as vs
import fractions
core = vs.core

clip = video_in

dsWidth  = video_in_dw
dsHeight = video_in_dh
  
if container_fps > 0.1:
  clipFps = container_fps
else:
  clipFps = 23.97602

if clipFps >= 22 and clipFps <= 24.5:
  interpMulti = 2.5

if clipFps >= 25 and clipFps <= 26:
  interpMulti = 2.4

if clipFps >= 29 and clipFps <= 31:
  interpMulti = 2
  interpModel = 5
  maxIpps = 20000000

if clipFps > 47:
 sys.exit()  

core.log_message(1, str(clipFps))


def float_to_ratio(flt):
    if int(flt) == flt:
        return int(flt), 1
    flt_str = str(flt)
    flt_split = flt_str.split('.')
    numerator = int(''.join(flt_split))
    denominator = 10 ** len(flt_split[1])
    return numerator, denominator

ffps = (interpMulti, 1)
if isinstance(interpMulti, float):
  ffps = float_to_ratio(interpMulti)
try:core.std.LoadPlugin("/content/vs-miscfilters-obsolete/build/libmiscfilters.so")
except Exception as e: print(e)
clip = core.misc.SCDetect(clip=clip,threshold=sceneDetectionThreshold)

if   interpMulti == 3:  maxIpps = maxIpps * 0.85
elif interpMulti == 4:  maxIpps = maxIpps * 0.80
elif interpMulti == 5:  maxIpps = maxIpps * 0.75
elif interpMulti == 6:  maxIpps = maxIpps * 0.70
elif interpMulti == 7:  maxIpps = maxIpps * 0.65
elif interpMulti == 8:  maxIpps = maxIpps * 0.60
elif interpMulti == 9:  maxIpps = maxIpps * 0.55
elif interpMulti >= 10: maxIpps = maxIpps * 0.50


clipIpps = clipFps * video_in_dw * video_in_dh * (interpMulti - 1)

try:
    cFormat = eval('vs.' + clip.format.name)
except:
    cFormat = vs.YUV420P8

try:
    cFamily = str(clip.format.color_family)
except:
    cFamily = 'ColorFamily.YUV'

if autoScale == True and autoScaleInteger == False and clipIpps > maxIpps:
  dsPercent = 1.00
  while clipIpps > maxIpps:
    dsPercent -= ScaleSteps
    dsWidth  = int(video_in_dw * dsPercent)
    dsHeight = int(video_in_dh * dsPercent)
    clipIpps = clipFps * dsWidth * dsHeight * (interpMulti - 1)
      
elif autoScale == True and autoScaleInteger == True and clipIpps > maxIpps:
  multi = interpMulti - 1
  vidW  = video_in_dw
  vidH  = video_in_dh
  while clipIpps > maxIpps:
    clipIpps = clipFps * vidW * vidH * multi
    vidW = vidW / 2
    vidH = vidH / 2
    dsWidth  = int(vidW)
    dsHeight = int(vidH)
else:
  autoScale = False
  

  def mult32(number):
    closest_multiple = ((number + 31) // 32) * 32
    return closest_multiple


if autoScale == True:
	if cFamily == 'ColorFamily.RGB':
		clip = core.resize.Bicubic(clip, width=dsWidth, height=dsHeight, format=vs.RGBS, range_in_s=cRange, filter_param_a=1, filter_param_b=0)
	else:
		clip = core.resize.Bicubic(clip, width=dsWidth, height=dsHeight, format=vs.RGBS, matrix_in_s=cMatrix, range_in_s=cRange, filter_param_a=1, filter_param_b=0)
else:
	if cFamily == 'ColorFamily.RGB':
		clip = core.resize.Bicubic(clip, format=vs.RGBS, range_in_s=cRange, filter_param_a=1, filter_param_b=0, width=mult32(dsWidth), height=mult32(dsHeight))
	else:
		clip = core.resize.Bicubic(clip, format=vs.RGBS, matrix_in_s=cMatrix, range_in_s=cRange, filter_param_a=1, filter_param_b=0, width=mult32(dsWidth), height=mult32(dsHeight))

clip = RIFE(clip,model=RIFEModel.v4_6, backend=Backend.TRT(num_streams=3), multi=2)
#print("output")

clip = core.resize.Bicubic(clip, width=dsWidth, height=dsHeight, format=vs.YUV420P8, matrix_s=cMatrix, range_s=cRange, filter_param_a=1, filter_param_b=0)

if osdInfo == True:
  if   interpModel == 0:  iModel = "RIFE "
  elif interpModel == 1:  iModel = "rife-HD "
  elif interpModel == 2:  iModel = "rife-UHD "
  elif interpModel == 3:  iModel = "rife-anime "
  elif interpModel == 4:  iModel = "rife-v2 "
  elif interpModel == 5:  iModel = "rife-v2.3 "
  elif interpModel == 6:  iModel = "rife-v2.4 "
  elif interpModel == 7:  iModel = "rife-v3.0 "
  elif interpModel == 8:  iModel = "rife-v3.1 "
  elif interpModel == 9:  iModel = "rife-v4 "
  elif interpModel == 10: iModel = "rife-v4-ES-SLOW "
  elif interpModel == 11: iModel = "rife-v4.1 "
  elif interpModel == 12: iModel = "rife-v4.1-ES-SLOW "
  elif interpModel == 13: iModel = "rife-v4.2 "
  elif interpModel == 14: iModel = "rife-v4.2-ES-SLOW "
  elif interpModel == 15: iModel = "rife-v4.3 "
  elif interpModel == 16: iModel = "rife-v4.3-ES-SLOW "
  elif interpModel == 17: iModel = "rife-v4.4 "
  elif interpModel == 18: iModel = "rife-v4.4-ES-SLOW "
  elif interpModel == 19: iModel = "rife-v4.5 "
  elif interpModel == 20: iModel = "rife-v4.5-ES "
  elif interpModel == 21: iModel = "rife-v4.6 "
  elif interpModel == 22: iModel = "rife-v4.6-ES "
  elif interpModel == 23: iModel = "sudo_rife4 "
  elif interpModel == 24: iModel = "sudo_rife4-ES-SLOW "
  elif interpModel == 25: iModel = "sudo_rife4-ES "
  clip = core.text.Text(clip, text=(iModel + str(interpMulti) + "x " + str(dsWidth) + "x" + str(dsHeight) + "@" + f"{(clipFps*interpMulti):.3f}" + "hz") ,alignment=7, scale=1) 
  
  
fps_fraction = fractions.Fraction(container_fps * interpMulti).limit_denominator()
output_num, output_den = fps_fraction.numerator, fps_fraction.denominator
#clip = core.std.AssumeFPS(clip, fpsnum=output_num, fpsden=output_den) GIVES WRONG FPS ON COLAB

# output to mpv

clip.set_output()

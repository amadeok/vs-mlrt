import random, threading, GPUtil
from vsmlrt import RIFE, RIFEModel, Backend
import vapoursynth as vs, os, numpy as np, cv2, ctypes, time
core = vs.core
#src = core.std.BlankClip(format=vs.RGBS)
import sys
sys.path.append("/content/mlrt/vs-mlrt/scripts/")

import vapoursynth as vs
core = vs.core
video_file_path = "/content/drive/MyDrive/970.mkv"
try:
  core.std.LoadPlugin(path="/usr/lib/x86_64-linux-gnu/libffms2.so")
except Exception as e:
  print(e)
print("\n----\n ", dir(core), "\n----------\n", dir(core.ffms2), "\n------------------")
print(os.path.isfile(video_file_path))
core.num_threads =1
print(core.num_threads)
import psutil, GPUtil

clip  = core.ffms2.Source(video_file_path)

rgb = core.resize.Bicubic(clip=clip,   format=vs.RGB24, matrix_in_s="709", transfer_in_s="709", width=1280, height=736 )
generator = rgb.frames()
print(rgb.format)

# clip_rgbh = rgb.std.SetFrameProp(prop="_FieldBased", intval=1)
# clip_rgbh = rgb.resize.Point(format=vs.RGBH, matrix_in_s="709", matrix_s="709")
clip_rgbh = core.resize.Bicubic(clip=clip, format=vs.RGBH, matrix_in_s="709", transfer_in_s="709", width=1280, height=736  )

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
flt = RIFE(clip_rgbh, model=model, backend=Backend.TRT(num_streams=6), multi=multi)
print("rife")

rgb2 = core.resize.Bicubic(clip=flt,   format=vs.RGB24, matrix_in_s="709", transfer_in_s="709", width=1280, height=736 )
gen = rgb2.frames()

ind = 1200 * 5/2
ind2 = 0
print(dir(rgb2))
pt = 0; ct = 0;
startt = time.time()
ave = 0
def monitor_gpu():
    print("START!!!!!!!!!!!!")

    while True:
        time.sleep(0.5)
        gpus = GPUtil.getGPUs()

        gpu_usage = gpus[0].load*100  # Get GPU usage (assuming you have at least one GPU)

        cpu_usage = psutil.cpu_percent(interval=0.1)  # Get CPU usage in the last 1 second

        print(f"GPU Usage: {gpu_usage}%  | CPU Usage: {cpu_usage}% | {ave} ")

        
# Create threads for monitoring CPU and GPU
gpu_thread = threading.Thread(target=monitor_gpu)
gpu_thread.start()
while 1:
    # pt = ct
    # ct = time.time()
    # gpus = GPUtil.getGPUs()

    # gpu_usage = gpus[0].load*100  # Get GPU usage (assuming you have at least one GPU)

    # cpu_usage = psutil.cpu_percent(interval=0.011)  # Get CPU usage in the last 1 second

    if ind2 % 500 == 0:
      startt = time.time()
      ind2 = 0
    pt = time.time()
    frame = rgb2.get_frame(ind)
    ct = time.time()
    d =  round(abs(ct - pt), 3)
    dd = (time.time() - startt)
    ave = round( ind2/dd, 2)
    #print(f"{ind:5} ", "o " if d < 0.03 else "- ", " | ", "% " if ind % multi == 0 else "  "  , d, " | ave", round( ind2/dd, 2),  " | ind2 ", ind2, " d ", round(dd,2) )
    
    #print(2, " ", type(frame), "    ", dir(frame))
        #frame = next(self.generator)

    plane_ptrs = [frame.get_read_ptr(i) for i in range(3)]

    frame_size = frame.format.bytes_per_sample * frame.width * frame.height


    planes_data = []
    for ptr in plane_ptrs:

        arr = np.ctypeslib.as_array((ctypes.c_uint8 * frame.width * frame.height).from_address(ptr.value))
        planes_data.append(arr.copy()) # still, (reduntantly) explicitly copying to avoid potential memory management conflicts

    planes_data2 = [planes_data[2],planes_data[1], planes_data[0]]
    # Stack the planes along the third axis to combine them
    combined_image =   np.dstack(planes_data2)#np.stack(planes_data, axis=-1)
    ind+=1
    ind2+=1
    # Convert combined image to BGR format using OpenCV (assuming YUV color space)
    #bgr_image = cv2.cvtColor(combined_image, cv2.COLOR_YCrCb2BGR)
    #rgb = np.dstack((r,g,b))
    #image = get_array_ctype(frame)  # cv2.merge((r, g, b))
    #print(combined_image.shape)
    # bgr_image = combined_image # cv2.cvtColor(combined_image, cv2.COLOR_YUV420p2RGB )
    # cv2.imshow("test", combined_image)
    # k = cv2.waitKey(0)
    # if k == ord("r"):
    #    ind = random.randint(2, 50000)
    #    print(ind)
    #    k = cv2.waitKey(0)
    # elif k == ord("a"):
    #    ind-=1
    # else:
    #    ind+=1
    # image_filename = f'image_{n:03}.jpg'
    # #cv2.imwrite(image_filename, bgr_image)
    # _, buffer = cv2.imencode('.jpg', combined_image)
    # image_bytes = io.BytesIO(buffer.tobytes())
    # # Add the image file to the ZIP archive
    # zip_file.writestr(f'image_{n:03}.jpg', image_bytes.getvalue())
    # #print(cv2.imwrite(f"aimage{1}.png",  bgr_image))
import os
os.environ["RIFE_PLAYER_TRT_DLL_PATH"] = os.path.expanduser("~") + r"\rifef _\mlrt_latest\vsmlrt-windows-x64-tensorrt.v15.6\vstrt.dll"

import random
from vsmlrt import RIFE, RIFEModel, Backend
import vapoursynth as vs, os, numpy as np, cv2, ctypes, time
core = vs.core
#src = core.std.BlankClip(format=vs.RGBS)


import vapoursynth as vs
core = vs.core#
video_file_path=  os.path.expanduser("~") + r"\Videos\2025-08-17 04-24-23.mkv"
try:
   p =  os.path.expanduser("~") +  r"\rifef _\ffms2-2.40-msvc\x64\ffms2.dll"
   if os.path.isfile(p):
      core.std.LoadPlugin(path=p)
   else:
      p =  "/usr/lib/x86_64-linux-gnu/libffms2.so"
      core.std.LoadPlugin(path=p)
except Exception as e:
  print(e)
print("\n----\n ", dir(core), "\n----------\n", dir(core.ffms2), "\n------------------")
print(os.path.isfile(video_file_path))
core.num_threads =1
print(core.num_threads)


clip  = core.ffms2.Source(video_file_path)

rgb = core.resize.Bicubic(clip=clip,   format=vs.RGB24, matrix_in_s="709", transfer_in_s="709", width=1280, height=704 )
generator = rgb.frames()
print(rgb.format)

clip_rgbh = core.resize.Bicubic(clip=clip, format=vs.RGBH, matrix_in_s="709", transfer_in_s="709", width=1280, height=704  )

print(clip_rgbh.format)
import vsmlrt
output = vsmlrt.inference(clip_rgbh, r"F:\all\GitHub\depth-anything-tensorrt\depth_anything_v2_vitb.onnx", backend=vsmlrt.Backend.TRT(fp16=True))

# model = RIFEModel.v4_6
# multi =5
# flt = RIFE(clip_rgbh, model=model, backend=Backend.TRT(), multi=multi)
# print("rife")

rgb2 = core.resize.Bicubic(clip=output,   format=vs.RGB24, matrix_in_s="709", transfer_in_s="709", width=1280, height=704 )
gen = rgb2.frames()

ind = 1200 * 5/2
print(dir(rgb2))
pt = 0; ct = 0;
while 1:
    # pt = ct
    # ct = time.time()
    pt = time.time()
    frame = rgb2.get_frame(ind)
    ct = time.time()
    d =  round(abs(ct - pt), 3)
    print(f"{ind:5} ", "o " if d < 0.03 else "- ", " | ", "% " if ind % multi == 0 else "  "  , d )
    
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

    # Convert combined image to BGR format using OpenCV (assuming YUV color space)
    #bgr_image = cv2.cvtColor(combined_image, cv2.COLOR_YCrCb2BGR)
    #rgb = np.dstack((r,g,b))
    #image = get_array_ctype(frame)  # cv2.merge((r, g, b))
    #print(combined_image.shape)
    bgr_image = combined_image # cv2.cvtColor(combined_image, cv2.COLOR_YUV420p2RGB )
    cv2.imshow("test", combined_image)
    k = cv2.waitKey(0)
    if k == ord("r"):
       ind = random.randint(2, 50000)
       print(ind)
       k = cv2.waitKey(0)
    elif k == ord("a"):
       ind-=1
    else:
       ind+=1
    # image_filename = f'image_{n:03}.jpg'
    # #cv2.imwrite(image_filename, bgr_image)
    # _, buffer = cv2.imencode('.jpg', combined_image)
    # image_bytes = io.BytesIO(buffer.tobytes())
    # # Add the image file to the ZIP archive
    # zip_file.writestr(f'image_{n:03}.jpg', image_bytes.getvalue())
    # #print(cv2.imwrite(f"aimage{1}.png",  bgr_image))
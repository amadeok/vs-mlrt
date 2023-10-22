import vapoursynth as vs
core = vs.core


try:
  core.std.LoadPlugin(path="/usr/lib/x86_64-linux-gnu/libffms2.so")
except Exception as e:
  print(e)

video_file_path = "/home/amadeok/Downloads/Demon Slayer (Kimetsu no Yaiba) [KaiDubs] [AS] [CC] [720p]/Demon Slayer - 01 - Cruelty [KaiDubs] [720p].mp4"
video = core.ffms2.Source(video_file_path)


  # Extract audio from the video
#audio = core.extract_audio(video)

# You can add video and audio processing filters if needed
# For example:
# video = core.std.Transpose(video)  # Rotate the video
# audio = core.audio.Limiter(audio, threshold=0.9)

final_clip = video# core.std.StackHorizontal([video, audio])

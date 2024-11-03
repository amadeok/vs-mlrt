import cv2
import numpy as np

def add_frame_numbers(input_video_path, output_video_path):
    # Open the video file
    cap = cv2.VideoCapture(input_video_path)
    
    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)  # Frames per second
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))  # Width of the frames
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))  # Height of the frames
    fourcc = cv2.VideoWriter_fourcc(*'XVID')  # Codec to use for output video
    
    # Create a VideoWriter object
    out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
    
    frame_count = 0  # Frame counter
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break  # Exit the loop if there are no frames
        frame_count += 1
        
        print(frame_count)
        cv2.putText(frame, f'Frame: {frame_count}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
        
        out.write(frame)

    # Release everything
    cap.release()
    out.release()
    # cv2.destroyAllWindows()

# Example usage
input_video = r"D:\soft\media\bleach1short.SVP.mp4"  # Path to the input video
output_video = r"D:\soft\media\bleach1shortSVP_fn.mp4"  # Path to the output video
add_frame_numbers(input_video, output_video)

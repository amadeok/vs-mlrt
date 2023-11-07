import cv2
import mss, time
import numpy as np

# Define the region of the screen to capture (x, y, width, height)
monitor = {"top": 0, "left": 100, "width": 1920, "height": 1080}

# Define the codec and create a VideoWriter object
fourcc = cv2.VideoWriter_fourcc(*'XVID')
out = cv2.VideoWriter('output.avi', fourcc, 20.0, (monitor['width'], monitor['height']))

# Create an MSS object
with mss.mss() as sct:
    while True:
        # Capture a frame from the specified region of the screen
        t0 = time.time()
        frame = np.array(sct.grab(monitor))

        # Convert RGB to BGR (OpenCV uses BGR format)
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

        # Write the frame to the output video file
        out.write(frame)
        t1 = time.time()
        d = t1-t0;
        print(round(d, 4))
        # Show the captured frame
        cv2.imshow('Screen Capture', frame)

        # Break the loop when 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

# Release the VideoWriter and destroy all OpenCV windows
out.release()
cv2.destroyAllWindows()

import os
import time

VIDEO_DIR = "/var/www/photomath-static"
THREE_HOURS = 3 * 60 * 60  # saniye cinsinden

now = time.time()

for filename in os.listdir(VIDEO_DIR):
    if filename.endswith(".mp4"):
        path = os.path.join(VIDEO_DIR, filename)
        if os.path.isfile(path):
            mtime = os.path.getmtime(path)
            if now - mtime > THREE_HOURS:
                os.remove(path)
                print(f"Silindi: {filename}")

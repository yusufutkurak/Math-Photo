import subprocess
import os
from uuid import uuid4

# Kullanıcıya özel session
session_id = uuid4().hex
input_folder = os.path.join("temp", session_id, "function_output")
output_path = os.path.join("static", f"output_video_{session_id}.mp4")

# Klasörleri oluştur (varsa geç)
os.makedirs(input_folder, exist_ok=True)
os.makedirs("static", exist_ok=True)

# FFmpeg komutu
command = [
    "ffmpeg",
    "-framerate", "30",
    "-i", f"{input_folder}/foto%d.jpg",
    "-vf", "scale='if(gte(mod(iw,2),1),iw-1,iw)':'if(gte(mod(ih,2),1),ih-1,ih)'",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    output_path
]

# Çalıştır
subprocess.run(command)
print("30 FPS video başarıyla oluşturuldu:", output_path)

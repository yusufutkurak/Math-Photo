import subprocess

# Klasör ve çıktı dosyası
input_folder = "graph_frames"
output_video = "output_graph_video_30fps.mp4"

# ffmpeg komutu: 30 fps ile sırayla tüm fotoğrafları al (001, 002, ...)
command = [
    "ffmpeg",
    "-framerate", "30",
    "-i", f"{input_folder}/frame_%03d.png",  # DİKKAT: %03d --> 001, 002...
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    output_video
]

# Komutu çalıştır
subprocess.run(command)

print("30 FPS video başarıyla oluşturuldu:", output_video)

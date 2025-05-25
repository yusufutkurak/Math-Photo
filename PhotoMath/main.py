from fastapi import FastAPI, File, UploadFile, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
import numpy as np
import os
import subprocess
import shutil
from uuid import uuid4

from graphics import generate_graph_frames

app = FastAPI()

# Statik klasörü oluştur
os.makedirs("static", exist_ok=True)
os.makedirs("temp", exist_ok=True)  # kullanıcı başına klasörlerin tutulduğu yer
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload/")
async def upload_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    equation: str = Form(...)
):
    # Her kullanıcıya özel klasör (UUID ile)
    session_id = uuid4().hex
    session_dir = os.path.join("temp", session_id)
    os.makedirs(session_dir, exist_ok=True)

    input_path = os.path.join(session_dir, "input.jpg")
    output_folder = os.path.join(session_dir, "function_output")
    graph_frame_folder = os.path.join(session_dir, "graph_frames")
    os.makedirs(output_folder, exist_ok=True)
    os.makedirs(graph_frame_folder, exist_ok=True)

    # Dosyayı kaydet
    with open(input_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Görsel işleme
    image = Image.open(input_path).convert("RGB")
    pixels = np.array(image).astype(np.int64)
    
    equation = equation.replace("^", "**")

    def f(x):
        try:
            return eval(
                equation,
                {
                    "x": x,
                    "np": np,
                    "sin": np.sin,
                    "cos": np.cos,
                    "tan": np.tan,
                    "cot": lambda x: 1 / np.tan(x),
                    "log": np.log10,
                    "ln": np.log,
                    "π": np.pi,
                    "e": np.e,
                    "__builtins__": {}
                }
            )
        except Exception as e:
            print(f"Hatalı denklem: {e}")
            return x

    # Frame üretimi
    for i in range(1, 501):
        value = f(pixels + i)
        wrapped = np.mod(value, 256).astype(np.uint8)
        frame = Image.fromarray(wrapped)

        w, h = frame.size
        if w % 2 != 0 or h % 2 != 0:
            frame = frame.crop((0, 0, w - (w % 2), h - (h % 2)))

        frame.save(os.path.join(output_folder, f"foto{i}.jpg"))

    # Normal video
    video_name = f"output_{session_id}.mp4"
    video_path = os.path.join("static", video_name)
    subprocess.run([
        "ffmpeg",
        "-framerate", "30",
        "-i", f"{output_folder}/foto%d.jpg",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        video_path
    ])

    # Grafik video hazırlığı
    graph_video_name = f"graph_video_{session_id}.mp4"
    graph_video_path = os.path.join("static", graph_video_name)

    def generate_graph_video():
        generate_graph_frames(input_folder=output_folder, output_folder=graph_frame_folder)
        subprocess.run([
            "ffmpeg",
            "-framerate", "30",
            "-i", f"{graph_frame_folder}/frame_%03d.png",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            graph_video_path
        ])

    background_tasks.add_task(generate_graph_video)

    return {
        "video_url": f"http://localhost:8000/static/{video_name}",
        "graph_video_url": f"http://localhost:8000/static/{graph_video_name}"
    }

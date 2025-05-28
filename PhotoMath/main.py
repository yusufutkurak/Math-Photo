from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
import numpy as np
import os
import shutil
import subprocess
import logging
from uuid import uuid4
import threading
import json

from graphics import generate_graph_frames

app = FastAPI()

STATIC_DIR = "/var/www/photomath-static"
TEMP_DIR = "/root/Math-Photo/PhotoMath/temp"
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def write_progress(path, normal=None, graph=None):
    progress = {}
    if os.path.exists(path):
        with open(path, "r") as f:
            progress = json.load(f)
    if normal is not None:
        progress["normal_progress"] = normal
    if graph is not None:
        progress["graph_progress"] = graph
    with open(path, "w") as f:
        json.dump(progress, f)

@app.get("/progress/{session_id}")
def get_progress(session_id: str):
    progress_file = os.path.join(TEMP_DIR, session_id, "progress.json")
    if os.path.exists(progress_file):
        with open(progress_file) as f:
            return json.load(f)
    return JSONResponse(content={"normal_progress": 0, "graph_progress": 0})

@app.post("/upload/")
async def upload_image(file: UploadFile = File(...), equation: str = Form(...)):
    session_id = uuid4().hex
    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)

    input_path = os.path.join(session_dir, "input.jpg")
    output_folder = os.path.join(session_dir, "function_output")
    graph_frame_folder = os.path.join(session_dir, "graph_frames")
    os.makedirs(output_folder, exist_ok=True)
    os.makedirs(graph_frame_folder, exist_ok=True)

    video_name = f"output_{session_id}.mp4"
    graph_video_name = f"graph_video_{session_id}.mp4"
    video_path = os.path.join(STATIC_DIR, video_name)
    graph_video_path = os.path.join(STATIC_DIR, graph_video_name)
    progress_path = os.path.join(session_dir, "progress.json")

    with open(input_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    logger.info(f"[UPLOAD] Dosya: {file.filename}")
    logger.info(f"[UPLOAD] Denklem: {equation}")

    image = Image.open(input_path).convert("RGB")
    pixels = np.array(image).astype(np.int64)
    equation = equation.replace("^", "**")

    def f(x):
        try:
            return eval(
                equation,
                {"x": x, "np": np, "sin": np.sin, "cos": np.cos, "tan": np.tan,
                 "cot": lambda x: 1 / np.tan(x), "log": np.log10, "ln": np.log,
                 "π": np.pi, "e": np.e, "√": np.sqrt, "__builtins__": {}}
            )
        except Exception as e:
            logger.warning(f"[ERROR] Denklem hatalı: {e}")
            return x

    def generate_normal_video():
        for i in range(1, 301):
            logger.info(f"[NORMAL FRAME] {i}/300")
            value = f(pixels + i)
            wrapped = np.mod(value, 256).astype(np.uint8)
            frame = Image.fromarray(wrapped)
            w, h = frame.size
            if w % 2 != 0 or h % 2 != 0:
                frame = frame.crop((0, 0, w - (w % 2), h - (h % 2)))
            frame.save(os.path.join(output_folder, f"foto{i}.jpg"))
            write_progress(progress_path, normal=int(i / 3))

        subprocess.run([
            "ffmpeg",
            "-framerate", "30",
            "-i", f"{output_folder}/foto%d.jpg",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            video_path
        ])
        write_progress(progress_path, normal=100)
        logger.info(f"[NORMAL DONE] {video_path}")

    def generate_graph_async():
        generate_graph_frames(output_folder, graph_frame_folder)
        subprocess.run([
            "ffmpeg",
            "-framerate", "30",
            "-i", f"{graph_frame_folder}/frame_%03d.png",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            graph_video_path
        ])
        write_progress(progress_path, graph=100)
        logger.info(f"[GRAPH DONE] {graph_video_path}")

    threading.Thread(target=generate_normal_video).start()
    threading.Thread(target=generate_graph_async).start()

    return {
        "video_url": f"http://159.65.53.223/media/{video_name}",
        "graph_video_url": f"http://159.65.53.223/media/{graph_video_name}",
        "progress_url": f"/progress/{session_id}"
    }

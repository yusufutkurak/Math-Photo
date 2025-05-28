from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
import numpy as np
import os
import shutil
import logging
from uuid import uuid4
import imageio.v3 as iio

# --- Log Ayarları ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

@app.post("/upload/")
async def upload_image(
    file: UploadFile = File(...),
    equation: str = Form(...)
):
    # Session klasörü
    session_id = uuid4().hex
    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)

    input_path = os.path.join(session_dir, "input.jpg")
    video_name = f"output_{session_id}.mp4"
    video_path = os.path.join(STATIC_DIR, video_name)

    # Dosyayı kaydet
    with open(input_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    logger.info(f"[UPLOAD] Dosya yüklendi: {file.filename}")
    logger.info(f"[UPLOAD] Denklem alındı: {equation}")

    # Görseli al ve numpy'a çevir
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
                    "√": np.sqrt,
                    "__builtins__": {}
                }
            )
        except Exception as e:
            logger.warning(f"[ERROR] Denklem hatalı: {e}")
            return x

    # Frame'leri bellekte tut
    frames = []
    for i in range(1, 301):
        logger.info(f"[FRAME] {i}. frame işleniyor...")
        value = f(pixels + i)
        wrapped = np.mod(value, 256).astype(np.uint8)
        frame = Image.fromarray(wrapped)

        # Genişlik ve yükseklik çift olmalı
        w, h = frame.size
        if w % 2 != 0 or h % 2 != 0:
            frame = frame.crop((0, 0, w - (w % 2), h - (h % 2)))

        frames.append(np.array(frame))

    # Video dosyasını yaz
    logger.info("[VIDEO] Video oluşturuluyor...")
    iio.imwrite(video_path, frames, fps=30, codec='libx264')
    logger.info(f"[DONE] Video kaydedildi: {video_path}")

    return {
        "video_url": f"/static/{video_name}",
        "graph_video_url": None  # Şimdilik grafik videosu yok
    }
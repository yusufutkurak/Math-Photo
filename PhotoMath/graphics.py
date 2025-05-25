import os
import numpy as np
import matplotlib
matplotlib.use("Agg")  # GUI yerine dosyaya çizim yap

import matplotlib.pyplot as plt
import cv2
from tqdm import tqdm

def generate_graph_frames(input_folder: str, output_folder: str):
    # Stil
    plt.style.use('dark_background')

    # Çıkış klasörü oluştur
    os.makedirs(output_folder, exist_ok=True)

    # Fotoğraf sayısını al
    num_images = len([f for f in os.listdir(input_folder) if f.endswith(".jpg")])

    r_vals, g_vals, b_vals = [], [], []

    for i in tqdm(range(1, num_images + 1), desc="Grafikler oluşturuluyor"):
        filename = os.path.join(input_folder, f"foto{i}.jpg")
        if not os.path.exists(filename):
            continue

        image = cv2.imread(filename)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        mean_rgb = np.mean(image, axis=(0, 1))
        r_vals.append(mean_rgb[0])
        g_vals.append(mean_rgb[1])
        b_vals.append(mean_rgb[2])

        fig, ax = plt.subplots(figsize=(8, 4))
        x_vals = np.arange(1, len(r_vals) + 1)

        ax.plot(x_vals, r_vals, color='red', label='Red')
        ax.plot(x_vals, g_vals, color='green', label='Green')
        ax.plot(x_vals, b_vals, color='blue', label='Blue')

        ax.set_title(f"RGB Ortalama Değerleri - Fotoğraf {i}")
        ax.set_xlim(0, num_images + 1)
        ax.set_ylim(0, 255)
        ax.set_xlabel("Frame")
        ax.set_ylabel("RGB Değeri")
        ax.legend(loc="upper right")
        ax.grid(True, alpha=0.3)

        plt.tight_layout()
        output_path = os.path.join(output_folder, f"frame_{i:03}.png")
        plt.savefig(output_path)
        plt.close()

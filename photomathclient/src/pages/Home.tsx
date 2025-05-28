import React, { useState, useEffect, useRef } from 'react';
import MathKeyboard from '../components/MathKeyboard';
import Dropzone from '../components/Dropzone';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import '../style/main.css';

function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [graphVideoUrl, setGraphVideoUrl] = useState<string | null>(null);
  const [readyToPlay, setReadyToPlay] = useState<boolean>(false);
  const [readyToPlayGraph, setReadyToPlayGraph] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [equation, setEquation] = useState<string>("");
  const [isVideoProcessing, setIsVideoProcessing] = useState<boolean>(false);
  const [isGraphProcessing, setIsGraphProcessing] = useState<boolean>(false);
  const [progressUrl, setProgressUrl] = useState<string | null>(null);
  const [normalProgress, setNormalProgress] = useState<number>(0);
  const [graphProgress, setGraphProgress] = useState<number>(0);
  const { t } = useTranslation();

  const videoRef = useRef<HTMLVideoElement>(null);
  const graphRef = useRef<HTMLVideoElement>(null);

  const waitUntilVideoExists = async (url: string, setter: (val: boolean) => void) => {
    const maxAttempts = 150; // 5 dakika
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (res.ok) {
          console.log("✅ Video bulundu:", url);
          setter(true);
          return;
        } else {
          console.log(`⏳ [${i + 1}/${maxAttempts}] Video henüz yok - Status: ${res.status}`);
        }
      } catch (e) {
        console.log(`⚠️ [${i + 1}/${maxAttempts}] Bağlantı hatası:`, e);
      }
      await new Promise(res => setTimeout(res, 2000));
    }
    console.warn("❌ 5 dakika geçti ama video hala bulunamadı:", url);
  };

 const retryPlayUntilSuccess = (
  ref: React.RefObject<HTMLVideoElement | null>,
  label: string
) => {
  let attempts = 0;
  const interval = setInterval(() => {
    const video = ref.current;
    if (!video) return;
    attempts++;
    console.log(`🎬 [${label}] Oynatma denemesi #${attempts}`);
    video.load();
    video.play().then(() => {
      console.log(`✅ [${label}] Başarıyla oynatılıyor`);
      clearInterval(interval);
    }).catch(() => {
      if (attempts >= 60) {
        console.warn(`❌ [${label}] 2 dakika içinde başlatılamadı`);
        clearInterval(interval);
      }
    });
  }, 2000);
};


  useEffect(() => {
    if (progressUrl) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(progressUrl);
          const data = await res.json();

          setNormalProgress(data.normal_progress);
          setGraphProgress(data.graph_progress);

          if (data.normal_progress >= 100) setIsVideoProcessing(false);
          if (data.graph_progress >= 100) setIsGraphProcessing(false);
        } catch (error) {
          console.error("Progress fetch failed:", error);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [progressUrl]);

  useEffect(() => {
    if (videoUrl) {
      setReadyToPlay(false);
      waitUntilVideoExists(videoUrl, setReadyToPlay);
    }
  }, [videoUrl]);

  useEffect(() => {
    if (graphVideoUrl) {
      setReadyToPlayGraph(false);
      waitUntilVideoExists(graphVideoUrl, setReadyToPlayGraph);
    }
  }, [graphVideoUrl]);

  useEffect(() => {
    if (readyToPlay && videoRef.current) {
      retryPlayUntilSuccess(videoRef, "Normal Video");
    }
  }, [readyToPlay]);

  useEffect(() => {
    if (readyToPlayGraph && graphRef.current) {
      retryPlayUntilSuccess(graphRef, "Graph Video");
    }
  }, [readyToPlayGraph]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateEquation(equation);
    if (error) return alert(error);
    if (!selectedFile) return alert('Lütfen bir dosya seçin.');

    setVideoUrl(null);
    setGraphVideoUrl(null);
    setProgressUrl(null);
    setNormalProgress(0);
    setGraphProgress(0);
    setReadyToPlay(false);
    setReadyToPlayGraph(false);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('equation', equation);

    setLoading(true);
    setIsVideoProcessing(true);
    setIsGraphProcessing(true);

    try {
      const response = await fetch('/upload/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setVideoUrl(data.video_url);
        setGraphVideoUrl(data.graph_video_url);
        setProgressUrl(data.progress_url);
      } else {
        alert('Bir hata oluştu!');
      }
    } catch (error) {
      console.error('Hata:', error);
      alert('Sunucuya erişilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
      setVideoUrl(null);
      setGraphVideoUrl(null);
    }
  };

  const validateEquation = (equation: string): string | null => {
    const allowedCharsRegex = /^([0-9πex√+\-*/^().\s]*((sin|cos|tan|cot|log|ln)\()?)*[0-9πex√+\-*/^().\s]*$/i;
    if (!allowedCharsRegex.test(equation)) return 'Geçersiz karakterler var.';
    if (/[+\-*/^]{2,}/.test(equation)) return 'Arka arkaya birden fazla operatör var.';
    if (/^[*/]/.test(equation.trim())) return 'İfade çarpma veya bölme ile başlayamaz.';
    const openParens = (equation.match(/\(/g) || []).length;
    const closeParens = (equation.match(/\)/g) || []).length;
    if (openParens !== closeParens) return 'Parantez dengesi hatalı.';
    if (!/[xX]/.test(equation)) return '"x" değişkeni eksik.';
    return null;
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="upload-section">
          <h2>{t('upload_photo')}</h2>
          <Dropzone onFileAccepted={setSelectedFile} />
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? t("loading") : t("submit")}
          </button>
        </div>

        <div className="keyboard-section">
          <h2>{t('enter_equation')}</h2>
          <MathKeyboard equation={equation} setEquation={setEquation} />
        </div>
      </div>

      <div className="video-container">
        <div className='video'>
          <h3>{t('normal_video')}</h3>
          <p>Yükleme: {normalProgress}%</p>
          <progress value={normalProgress} max="100" />
          {isVideoProcessing && normalProgress < 100 && (
            <div className="spinner-container">
              <div className="spinner-circle"></div>
              <span>{t('processing_image')}</span>
            </div>
          )}
          {readyToPlay && normalProgress === 100 && (
            <video
              ref={videoRef}
              key={videoUrl}
              controls
              muted
              autoPlay
              width="100%"
              style={{ marginTop: "1rem", backgroundColor: "#000" }}
            >
              <source src={videoUrl ?? ""} type="video/mp4" />
              Tarayıcınız video etiketini desteklemiyor.
            </video>
          )}
        </div>

        <div className='video'>
          <h3>{t('graph_video')}</h3>
          <p>Yükleme: {graphProgress}%</p>
          <progress value={graphProgress} max="100" />
          {isGraphProcessing && graphProgress < 100 && (
            <div className="spinner-container">
              <div className="spinner-circle"></div>
              <span>{t('processing_graph')}</span>
            </div>
          )}
          {readyToPlayGraph && graphProgress === 100 && (
            <video
              ref={graphRef}
              key={graphVideoUrl}
              controls
              muted
              autoPlay
              width="100%"
              style={{ marginTop: "1rem", backgroundColor: "#000" }}
            >
              <source src={graphVideoUrl ?? ""} type="video/mp4" />
              Tarayıcınız video etiketini desteklemiyor.
            </video>
          )}
        </div>
      </div>

      <footer className="footer">
        {t('footer_text')}
      </footer>
    </div>
  );
}

export default Home;

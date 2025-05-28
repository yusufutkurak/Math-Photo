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
  const [loading, setLoading] = useState<boolean>(false);
  const [equation, setEquation] = useState<string>("");
  const [isVideoProcessing, setIsVideoProcessing] = useState<boolean>(false);
  const [isGraphProcessing, setIsGraphProcessing] = useState<boolean>(false);
  const [progressUrl, setProgressUrl] = useState<string | null>(null);
  const [normalProgress, setNormalProgress] = useState<number>(0);
  const [graphProgress, setGraphProgress] = useState<number>(0);
  const [videoReady, setVideoReady] = useState<boolean>(false);
  const { t } = useTranslation();

  const videoRef = useRef<HTMLVideoElement>(null);
  const graphRef = useRef<HTMLVideoElement>(null);

  // useEffect: Progress tracking
  useEffect(() => {
    if (!progressUrl) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(progressUrl);
        const data = await res.json();
        console.log(`⏳ [${data.normal_progress}/100] Progress`);

        setNormalProgress(data.normal_progress);
        setGraphProgress(data.video_ready ? data.graph_progress : 0);
        setVideoReady(data.video_ready);

        if (data.normal_progress >= 100) setIsVideoProcessing(false);
        if (data.video_ready && data.graph_progress >= 100) setIsGraphProcessing(false);
      } catch (error) {
        console.error("Progress fetch failed:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [progressUrl]);

  // Auto-check for video availability (wait until it is actually playable)
  useEffect(() => {
    if (!videoUrl || !videoReady) return;

    let attempts = 0;
    const maxAttempts = 150;

    const checkPlayable = async () => {
      try {
        const res = await fetch(videoUrl, { method: "HEAD" });
        if (res.ok) {
          setVideoReady(true);
          console.log("✅ Video is available:", videoUrl);
        } else {
          throw new Error("Still not ready");
        }
      } catch {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkPlayable, 2000);
        } else {
          console.error("⛔ Video never became available.");
        }
      }
    };

    checkPlayable();
  }, [videoUrl, videoReady]);

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
    setVideoReady(false);

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

          {videoUrl && videoReady && (
            <video
              ref={videoRef}
              key={videoUrl}
              controls
              muted
              autoPlay
              width="100%"
              style={{ marginTop: "1rem", backgroundColor: "#000" }}
            >
              <source src={videoUrl} type="video/mp4" />
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

          {graphVideoUrl && videoReady && graphProgress === 100 && (
            <video
              ref={graphRef}
              key={graphVideoUrl}
              controls
              muted
              autoPlay
              width="100%"
              style={{ marginTop: "1rem", backgroundColor: "#000" }}
            >
              <source src={graphVideoUrl} type="video/mp4" />
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

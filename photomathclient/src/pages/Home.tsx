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
  const videoRef = useRef<HTMLVideoElement>(null);
  const graphRef = useRef<HTMLVideoElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (progressUrl) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(progressUrl);
          const data = await res.json();
          console.log("📦 Progress update:", data); // BURAYA EKLE
          setNormalProgress(data.normal_progress);
          setGraphProgress(data.graph_progress);
          setVideoReady(data.video_ready);

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
    if (videoReady && videoRef.current) {
      const tryPlay = async (retries = 0) => {
        try {
          await videoRef.current!.play();
          console.log("✅ [Normal Video] Başarıyla oynatılıyor");
        } catch {
          if (retries < 30) setTimeout(() => tryPlay(retries + 1), 2000);
        }
      };
      tryPlay();
    }
  }, [videoReady, videoUrl]);

  useEffect(() => {
  if (videoReady && !graphVideoUrl) {
    // graph video URL'i backendden otomatik gelmeyecekse, tahminle oluştur
    const url = videoUrl?.replace("output_", "graph_video_");
    if (url) setGraphVideoUrl(url);
  }
}, [videoReady, videoUrl]);

useEffect(() => {
  if (graphVideoUrl && graphRef.current) {
    const tryPlayGraph = async (retries = 0) => {
      try {
        await graphRef.current!.play();
        console.log("✅ [Graph Video] Başarıyla oynatılıyor");
      } catch {
        if (retries < 30) setTimeout(() => tryPlayGraph(retries + 1), 2000);
      }
    };
    tryPlayGraph();
  }
}, [graphVideoUrl]);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const error = validateEquation(equation);
  if (error) return alert(error);
  if (!selectedFile) return alert('Lütfen bir dosya seçin.');

  console.log("🚀 Upload started");

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
      console.log("✅ Upload response:", data);
      setVideoUrl(data.video_url);
      setGraphVideoUrl(data.graph_video_url);
      setProgressUrl(data.progress_url);
    } else {
      console.error("❌ Upload failed");
      alert('Bir hata oluştu!');
    }
  } catch (error) {
    console.error('Hata:', error);
    alert('Sunucuya erişilemedi.');
  } finally {
    console.log("🛑 Upload finished");
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

  const shouldShowSpinner =
  normalProgress >= 100 && !videoReady && (loading || isVideoProcessing);


  console.log("🔍 Spinner check →", {
    normalProgress,
    videoReady,
    loading,
    isVideoProcessing,
    shouldShowSpinner 
  });
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
        {/* Normal Video */}
        <div className="video">
          <h3>{t('normal_video')}</h3>
         
         {isVideoProcessing && normalProgress < 100 ? (
            <div className="custom-progress">
              <div
                style={{ "--progress-width": `${normalProgress}%` } as React.CSSProperties}
              ></div>
            </div>
          ) : shouldShowSpinner ? (
            <div className="spinner-container">
              <div className="spinner-circle"></div>
              <span>Videonuz hazırlanıyor...</span>
            </div>
          ) : (
            videoUrl && videoReady && (
              <video
                ref={videoRef}
                key="normal-video"
                controls
                muted
                autoPlay
                width="100%"
                style={{ marginTop: "1rem", backgroundColor: "#000" }}
              >
                <source src={videoUrl ?? ""} type="video/mp4" />
                Tarayıcınız video etiketini desteklemiyor.
              </video>
            )
          )}


        </div>

        {videoReady && (
          <div className="video">
            <h3>{t('graph_video')}</h3>

            {!graphVideoUrl || isGraphProcessing ? (
              <div className="spinner-container">
                <div className="spinner-circle"></div>
                <span>RGB grafiği hazırlanıyor...</span>
              </div>
            ) : (
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
        )}

      </div>

      <footer className="footer">
        {t('footer_text')}
      </footer>
    </div>
  );
}

export default Home;
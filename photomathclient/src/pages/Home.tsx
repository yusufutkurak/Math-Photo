import React, { useState } from 'react';
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
  const { t, i18n } = useTranslation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
      setVideoUrl(null);
      setGraphVideoUrl(null);
    }
  };

  const validateEquation = (equation: string): string | null => {
    const allowedCharsRegex = /^[0-9πex√+\-*/^()x.\s]*(sin|cos|tan|cot|log|ln)?[0-9πex√+\-*/^()x.\s]*$/;
    if (!allowedCharsRegex.test(equation)) return 'Geçersiz karakterler var.';
    if (/[+\-*/^]{2,}/.test(equation)) return 'Arka arkaya birden fazla operatör var.';
    if (/^[*/]/.test(equation.trim())) return 'İfade çarpma veya bölme ile başlayamaz.';
    const openParens = (equation.match(/\(/g) || []).length;
    const closeParens = (equation.match(/\)/g) || []).length;
    if (openParens !== closeParens) return 'Parantez dengesi hatalı.';
    if (!/[xX]/.test(equation)) return '"x" değişkeni eksik.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateEquation(equation);
    if (error) return alert(error);
    if (!selectedFile) return alert('Lütfen bir dosya seçin.');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('equation', equation);
    setLoading(true);
    setIsVideoProcessing(true);
    setIsGraphProcessing(true);

    try {
      const response = await fetch('http://159.65.53.223/upload/', {
        method: 'POST',
        body: formData,
      });


      if (response.ok) {
        const data = await response.json();
        setVideoUrl(data.video_url);
        setIsVideoProcessing(false); // normal video bitti
        setGraphVideoUrl(null);

        // Grafik videosunu düzenli kontrol et
        // Grafik videosunu düzenli kontrol et
      const intervalId = setInterval(async () => {
        try {
          console.log("Kontrol ediliyor:", data.graph_video_url);
          const res = await fetch(data.graph_video_url, { method: 'HEAD' });
          if (res.ok) {
            setGraphVideoUrl(data.graph_video_url);
            setIsGraphProcessing(false);
            clearInterval(intervalId);
          }
        } catch (err) {
          console.warn("Henüz hazır değil:", err);
        }
      }, 3000);

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
          {isVideoProcessing && (
            <div className="spinner-container">
              <div className="spinner-circle"></div>
              <span>{t('processing_image')}</span>
            </div>
          )}
          {videoUrl && (
            <video controls>
              <source src={videoUrl} type="video/mp4" />
            </video>
          )}
        </div>

        <div className='video'>
          <h3>{t('graph_video')}</h3>
          {isGraphProcessing && (
            <div className="spinner-container">
              <div className="spinner-circle"></div>
              <span>{t('processing_graph')}</span>
            </div>
          )}
          {graphVideoUrl && (
            <video controls>
              <source src={graphVideoUrl} type="video/mp4" />
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

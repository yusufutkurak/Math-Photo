// 📁 Home.tsx (React)
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const POLL_INTERVAL = 2000; // 2 saniye

export default function Home() {
  const [graphProgress, setGraphProgress] = useState(0);
  const [normalProgress, setNormalProgress] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [graphUrl, setGraphUrl] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [polling, setPolling] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const upload = async (file: File, equation: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("equation", equation);

    const res = await axios.post("http://159.65.53.223/upload/", form);
    const { video_url, graph_video_url, progress_url } = res.data;
    const id = progress_url.split("/").pop();

    setVideoUrl(video_url);
    setGraphUrl(graph_video_url);
    setSessionId(id);
    setPolling(true);
  };

  useEffect(() => {
    if (!polling || !sessionId) return;

    const interval = setInterval(async () => {
      const res = await axios.get(`http://159.65.53.223/progress/${sessionId}`);
      const data = res.data;

      setNormalProgress(data.normal_progress);

      if (data.video_ready && !videoReady) {
        console.log("✅ Video hazır");
        setVideoReady(true);
      }

      if (data.video_ready) {
        setGraphProgress(data.graph_progress);

        if (videoRef.current && videoRef.current.paused && videoRef.current.readyState >= 3) {
          console.log("🎬 Video otomatik başlatılıyor");
          videoRef.current.play().catch(() => {});
        }
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [polling, sessionId, videoReady]);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2>Normal Video</h2>
      <p>İlerleme: {normalProgress}%</p>
      <progress value={normalProgress} max={100} />

      {videoReady && (
        <video
          ref={videoRef}
          key={videoUrl}
          controls
          width="100%"
          autoPlay
          muted
          style={{ marginTop: "1rem", backgroundColor: "#000" }}
        >
          <source src={videoUrl} type="video/mp4" />
          Tarayıcınız video etiketini desteklemiyor.
        </video>
      )}

      {videoReady && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Grafik Videosu</h2>
          <p>İlerleme: {graphProgress}%</p>
          <progress value={graphProgress} max={100} />

          {graphProgress === 100 && (
            <video
              controls
              width="100%"
              style={{ marginTop: "1rem", backgroundColor: "#000" }}
            >
              <source src={graphUrl} type="video/mp4" />
              Tarayıcınız video etiketini desteklemiyor.
            </video>
          )}
        </div>
      )}
    </div>
  );
}

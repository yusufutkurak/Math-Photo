import React from "react";
import '../style/about.css';
import i18n from '../i18n'; 
import { useTranslation } from 'react-i18next';

function About() {
  const { t, i18n } = useTranslation();
    
  return (
    <div className="about-container">
        <div className="about-card-container">
        <div className="photo-container">
            <img src="img/vesikalık.jpeg" alt="Profile" className="profile-img" />
        </div>
        <div className="info-container">
            <div className="info-text">
            <h2>{t('about_title')}</h2>
            <p>
                {t('about_me')}
            </p>
            </div>
            <div className="links-container">
            <a href="https://www.linkedin.com/in/yusuf-utkurak/" className="social-icon linkedin" target="_blank" rel="noopener noreferrer">
                LinkedIn
            </a>
            <a href="https://github.com/yusufutkurak" className="social-icon github" target="_blank" rel="noopener noreferrer">
                GitHub
            </a>
            <a href="https://www.youtube.com/@yusufutkurak1363/videos" className="social-icon youtube" target="_blank" rel="noopener noreferrer">
                Youtube
                <div className="youtube-logo">
                    <div className="youtube-logo-inner">
                    </div>
                </div>
            </a>
            </div>
        </div>
      </div>
    </div>
  );
}

export default About;

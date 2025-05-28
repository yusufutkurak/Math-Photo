import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import i18n from './i18n'; 
import './i18n'; 

import { useTranslation } from 'react-i18next';
import LangSwitch from './components/LangSwitch';
import './style/navbar.css'

function App() {
  const { t, i18n } = useTranslation();
  const toggleLanguage = () => {
      const newLang = i18n.language === 'tr' ? 'en' : 'tr';
      i18n.changeLanguage(newLang);
    };

  return (
    <div>
      <nav className="navbar">
      <div className="navbar-inner">
        <h1 className="navbar-title">Func Pix</h1>
        <ul className="navbar-links">
          <li><a href="/">{t('nav_home')}</a></li>
          <li className="navbar-link curious-link">
            <a href="/about">{t('nav_purpose')}</a>
          </li>
          <li><LangSwitch/></li>
        </ul>
      </div>
    </nav>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
    
    </div>
  );
}

export default App;

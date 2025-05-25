import { useTranslation } from 'react-i18next';
import '../style/switch.css';

const LangSwitch = () => {
  const { i18n } = useTranslation(); // ✅ doğru i18n burada

   const toggleLanguage = () => {
      const newLang = i18n.language === 'tr' ? 'en' : 'tr';
      i18n.changeLanguage(newLang);
    };

  return (
    <div className="language-switch" onClick={toggleLanguage}>
      <div className={`toggle ${i18n.language === 'en' ? 'en' : 'tr'}`}>
        {i18n.language === 'en' ? 'EN' : 'TR'}
      </div>
    </div>
  );
};

export default LangSwitch;
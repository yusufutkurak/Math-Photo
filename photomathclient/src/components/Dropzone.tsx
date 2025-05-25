import React, { useRef } from 'react';
import '../style/dropzone.css';
import i18n from '../i18n'; // UNUTMA: import et
import { useTranslation } from 'react-i18next';

interface DropzoneProps {
  onFileAccepted: (file: File) => void;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFileAccepted }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const { t, i18n } = useTranslation();

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileAccepted(file);
      setFileName(file.name);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileAccepted(file);
      setFileName(file.name);
    }
  };

  return (
    <label
      className="dropzone"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      <div onClick={() => fileInputRef.current?.click()}>
        {fileName ? (
          <div className="file-info">✅ {fileName} yüklendi</div>
        ) : (
          <div className="dropzone-placeholder">{t('dropzone')}</div>
        )}
      </div>
    </label>

  );
};

export default Dropzone;

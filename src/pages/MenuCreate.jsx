import React, { useState, useCallback } from 'react';
import { Upload, ImagePlus, Download, Loader2, ArrowDown, ArrowRight, RefreshCw, X, Check, Save } from 'lucide-react';

const MenuCreate = () => {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [preview1, setPreview1] = useState(null);
  const [preview2, setPreview2] = useState(null);
  const [mergedImage, setMergedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [direction, setDirection] = useState('horizontal');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleImageUpload = (e, imageNum) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh hợp lệ');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (imageNum === 1) {
        setImage1(file);
        setPreview1(reader.result);
      } else {
        setImage2(file);
        setPreview2(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (imageNum) => {
    if (imageNum === 1) {
      setImage1(null);
      setPreview1(null);
    } else {
      setImage2(null);
      setPreview2(null);
    }
    setMergedImage(null);
  };

  const mergeImages = async () => {
    if (!image1 || !image2) {
      setError('Vui lòng upload đủ 2 ảnh menu');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image1', image1);
      formData.append('image2', image2);
      formData.append('direction', direction);

      const response = await fetch('/api/merge-menu', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi ghép ảnh');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMergedImage(url);
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi ghép ảnh');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!mergedImage) return;

    const link = document.createElement('a');
    link.href = mergedImage;
    link.download = `menu-merged-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateMenu = async () => {
    if (!image1 || !image2) {
      setError('Vui lòng upload đủ 2 ảnh menu');
      return;
    }

    setUpdating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('image1', image1);
      formData.append('image2', image2);
      formData.append('direction', direction);

      const response = await fetch('/api/update-menu', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi cập nhật menu');
      }

      setSuccessMessage(data.message || 'Đã cập nhật menu.jpg thành công!');
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi cập nhật menu');
    } finally {
      setUpdating(false);
    }
  };

  const reset = () => {
    setImage1(null);
    setImage2(null);
    setPreview1(null);
    setPreview2(null);
    setMergedImage(null);
    setError(null);
    setSuccessMessage(null);
  };

  const ImageUploader = ({ imageNum, preview, onUpload, onRemove }) => (
    <div className="menu-uploader">
      <input
        type="file"
        id={`image-${imageNum}`}
        accept="image/*"
        onChange={(e) => onUpload(e, imageNum)}
        className="hidden-input"
      />
      {preview ? (
        <div className="preview-container">
          <img src={preview} alt={`Menu ${imageNum}`} className="preview-image" />
          <button className="remove-btn" onClick={() => onRemove(imageNum)}>
            <X size={16} />
          </button>
          <div className="image-badge">
            <Check size={14} />
            Ảnh {imageNum}
          </div>
        </div>
      ) : (
        <label htmlFor={`image-${imageNum}`} className="upload-label">
          <div className="upload-content">
            <ImagePlus size={48} className="upload-icon" />
            <span className="upload-text">Upload ảnh menu {imageNum}</span>
            <span className="upload-hint">Kéo thả hoặc click để chọn</span>
          </div>
        </label>
      )}
    </div>
  );

  return (
    <div className="menu-create-page">
      <div className="menu-create-container">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">
            <Upload size={32} />
            Ghép Menu
          </h1>
          <p className="page-subtitle">Upload 2 ảnh menu và ghép chúng lại thành 1 ảnh duy nhất</p>
        </div>

        {/* Direction Toggle */}
        <div className="direction-toggle">
          <span className="toggle-label">Kiểu ghép:</span>
          <div className="toggle-buttons">
            <button
              className={`toggle-btn ${direction === 'vertical' ? 'active' : ''}`}
              onClick={() => setDirection('vertical')}
            >
              <ArrowDown size={18} />
              Dọc
            </button>
            <button
              className={`toggle-btn ${direction === 'horizontal' ? 'active' : ''}`}
              onClick={() => setDirection('horizontal')}
            >
              <ArrowRight size={18} />
              Ngang
            </button>
          </div>
        </div>

        {/* Upload Section */}
        <div className={`upload-section ${direction}`}>
          <ImageUploader
            imageNum={1}
            preview={preview1}
            onUpload={handleImageUpload}
            onRemove={removeImage}
          />
          <div className="connector">
            {direction === 'vertical' ? <ArrowDown size={24} /> : <ArrowRight size={24} />}
          </div>
          <ImageUploader
            imageNum={2}
            preview={preview2}
            onUpload={handleImageUpload}
            onRemove={removeImage}
          />
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            <Check size={18} />
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <X size={18} />
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="btn btn-primary"
            onClick={mergeImages}
            disabled={!image1 || !image2 || loading}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="spin" />
                Đang ghép...
              </>
            ) : (
              <>
                <ImagePlus size={20} />
                Ghép ảnh
              </>
            )}
          </button>
          {(preview1 || preview2) && (
            <button className="btn btn-secondary" onClick={reset}>
              <RefreshCw size={20} />
              Làm mới
            </button>
          )}
        </div>

        {/* Result Section */}
        {mergedImage && (
          <div className="result-section">
            <h2 className="result-title">
              <Check size={24} />
              Kết quả ghép ảnh
            </h2>
            <div className="result-preview">
              <img src={mergedImage} alt="Merged Menu" className="merged-image" />
            </div>
            <div className="result-actions">
              <button className="btn btn-download" onClick={downloadImage}>
                <Download size={20} />
                Tải xuống
              </button>
              <button
                className="btn btn-update"
                onClick={updateMenu}
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Loader2 size={20} className="spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Cập nhật Menu
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .menu-create-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%);
          padding: 40px 20px;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .menu-create-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .page-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 10px;
        }

        .page-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.1rem;
        }

        .direction-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 30px;
        }

        .toggle-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
        }

        .toggle-buttons {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 12px;
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-btn:hover {
          color: #fff;
        }

        .toggle-btn.active {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
        }

        .upload-section {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }

        .upload-section.vertical {
          flex-direction: column;
          align-items: center;
        }

        .upload-section.horizontal {
          flex-direction: row;
          justify-content: center;
          align-items: center;
        }

        .connector {
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.3);
        }

        .menu-uploader {
          flex: 1;
          max-width: 400px;
        }

        .hidden-input {
          display: none;
        }

        .upload-label {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.02);
        }

        .upload-label:hover {
          border-color: rgba(99, 102, 241, 0.5);
          background: rgba(99, 102, 241, 0.05);
        }

        .upload-content {
          text-align: center;
          padding: 30px;
        }

        .upload-icon {
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 12px;
        }

        .upload-text {
          display: block;
          color: rgba(255, 255, 255, 0.8);
          font-size: 1rem;
          margin-bottom: 6px;
        }

        .upload-hint {
          display: block;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
        }

        .preview-container {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .preview-image {
          width: 100%;
          height: auto;
          display: block;
        }

        .remove-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: rgba(239, 68, 68, 0.9);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .remove-btn:hover {
          background: #ef4444;
          transform: scale(1.1);
        }

        .image-badge {
          position: absolute;
          bottom: 10px;
          left: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(34, 197, 94, 0.9);
          color: #fff;
          font-size: 0.8rem;
          font-weight: 500;
          border-radius: 20px;
        }

        .error-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          color: #f87171;
          margin-bottom: 20px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 40px;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .btn-download {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }

        .btn-download:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .result-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 30px;
          text-align: center;
        }

        .result-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #22c55e;
          font-size: 1.3rem;
          margin-bottom: 20px;
        }

        .result-preview {
          margin-bottom: 20px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .merged-image {
          width: 100%;
          height: auto;
          display: block;
        }

        .result-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .success-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 10px;
          color: #22c55e;
          margin-bottom: 20px;
        }

        .btn-update {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #fff;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
        }

        .btn-update:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
        }

        @media (max-width: 768px) {
          .upload-section.horizontal {
            flex-direction: column;
          }

          .menu-uploader {
            max-width: 100%;
            width: 100%;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default MenuCreate;

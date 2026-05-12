import React, { useState } from 'react';
import './Detection.css';

const API_URL = 'http://localhost:5000';

function Detection() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.prediction);
      } else {
        alert('Erreur: ' + data.error);
      }
    } catch (error) {
      alert('Erreur de connexion: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="detection-page">
      <h1 className="page-title">🔍 Détection de Maladies</h1>
      <p className="page-subtitle">
        Uploadez une photo de votre plante pour une analyse instantanée
      </p>

      <div className="detection-container">
        {/* Zone d'upload */}
        {!preview && (
          <div className="upload-zone">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              id="file-input"
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input" className="upload-label">
              <div className="upload-icon">📸</div>
              <h3>Choisir une image</h3>
              <p>JPG, PNG ou JPEG</p>
            </label>
          </div>
        )}

        {/* Prévisualisation */}
        {preview && !result && (
          <div className="preview-section">
            <img src={preview} alt="Preview" className="preview-image" />
            <div className="action-buttons">
              <button onClick={handleAnalyze} disabled={loading} className="btn-analyze">
                {loading ? '⏳ Analyse en cours...' : '🚀 Analyser la plante'}
              </button>
              <button onClick={handleReset} className="btn-reset">
                🔄 Changer l'image
              </button>
            </div>
          </div>
        )}

        {/* Résultats */}
        {result && (
          <div className="result-section">
            <div className="result-image">
              <img src={preview} alt="Analyzed" />
            </div>

            <div className={`result-card ${result.is_healthy ? 'healthy' : 'diseased'}`}>
              <h2 className="result-title">
                {result.is_healthy ? '✅ Plante Saine' : '⚠️ Maladie Détectée'}
              </h2>

              <div className="result-details">
                <div className="result-item">
                  <span className="label">Type de plante:</span>
                  <span className="value">
                    {result.plant_type === 'Tomate' && '🍅'}
                    {result.plant_type === 'Pomme de terre' && '🥔'}
                    {result.plant_type === 'Poivron' && '🌶️'}
                    {' '}{result.plant_type}
                  </span>
                </div>

                <div className="result-item">
                  <span className="label">État:</span>
                  <span className={`value ${result.is_healthy ? 'healthy' : 'diseased'}`}>
                    {result.is_healthy ? 'Saine' : 'Malade'}
                  </span>
                </div>

                {!result.is_healthy && (
                  <div className="result-item">
                    <span className="label">Maladie:</span>
                    <span className="value disease">{result.disease}</span>
                  </div>
                )}

                <div className="result-item">
                  <span className="label">Confiance:</span>
                  <span className="value confidence">
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill" 
                        style={{ width: `${result.confidence}%` }}
                      ></div>
                    </div>
                    {result.confidence}%
                  </span>
                </div>
              </div>

              <button onClick={handleReset} className="btn-new-analysis">
                🔄 Nouvelle Analyse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Detection;
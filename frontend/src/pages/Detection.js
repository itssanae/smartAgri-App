import React, { useState } from 'react';
import './Detection.css';

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

  const handleSubmit = async () => {
    if (!selectedImage) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      // FETCH au lieu d'axios
      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>🔍 Détection de Maladies</h1>
      
      <div className="upload-zone">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageChange}
          id="file-input"
          style={{display: 'none'}}
        />
        <label htmlFor="file-input" className="upload-btn">
          📸 Choisir une image
        </label>
      </div>

      {preview && (
        <div className="preview">
          <img src={preview} alt="Preview" />
          <button onClick={handleSubmit} disabled={loading} className="btn-primary">
            {loading ? '⏳ Analyse...' : '🚀 Analyser'}
          </button>
        </div>
      )}

      {result && !result.error && (
        <div className={`result ${result.is_healthy ? 'healthy' : 'diseased'}`}>
          <h2>📊 Résultats</h2>
          <p><strong>Plante:</strong> {result.plant_type}</p>
          <p><strong>État:</strong> {result.is_healthy ? '✅ Saine' : '⚠️ Malade'}</p>
          {!result.is_healthy && <p><strong>Maladie:</strong> {result.disease}</p>}
          <p><strong>Confiance:</strong> {result.confidence}%</p>
        </div>
      )}
    </div>
  );
}

export default Detection;
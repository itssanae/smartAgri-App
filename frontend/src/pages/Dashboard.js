import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const API_URL = 'http://localhost:5000';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh toutes les 5s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/api/stats`),
        fetch(`${API_URL}/api/history`)
      ]);

      const statsData = await statsRes.json();
      const historyData = await historyRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (historyData.success) setHistory(historyData.history);
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">⏳ Chargement des données...</div>;
  }

  if (!stats) {
    return <div className="error">❌ Erreur de connexion au backend</div>;
  }

  return (
    <div className="dashboard-page">
      <h1 className="page-title">📈 Tableau de Bord</h1>

      {/* Cartes statistiques */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h2>{stats.total}</h2>
            <p>Total Analyses</p>
          </div>
        </div>

        <div className="stat-card healthy">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h2>{stats.healthy}</h2>
            <p>Plantes Saines</p>
          </div>
        </div>

        <div className="stat-card diseased">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h2>{stats.diseased}</h2>
            <p>Plantes Malades</p>
          </div>
        </div>

        <div className="stat-card percentage">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h2>
              {stats.total > 0 
                ? Math.round((stats.healthy / stats.total) * 100) 
                : 0}%
            </h2>
            <p>Taux de Santé</p>
          </div>
        </div>
      </div>

      {/* Statistiques par plante */}
      <div className="plants-section">
        <h2>🌿 Statistiques par Type de Plante</h2>
        <div className="plants-grid">
          {Object.entries(stats.by_plant).map(([plant, data]) => (
            <div key={plant} className="plant-card">
              <h3>
                {plant === 'Tomate' && '🍅'} 
                {plant === 'Pomme de terre' && '🥔'}
                {plant === 'Poivron' && '🌶️'}
                {plant === 'Inconnue' && '❓'}
                {' '}{plant}
              </h3>
              <div className="plant-stats">
                <div className="plant-stat">
                  <span className="label">Total:</span>
                  <span className="value">{data.total}</span>
                </div>
                <div className="plant-stat success">
                  <span className="label">Saines:</span>
                  <span className="value">{data.healthy}</span>
                </div>
                <div className="plant-stat danger">
                  <span className="label">Malades:</span>
                  <span className="value">{data.diseased}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historique récent */}
      <div className="history-section">
        <h2>📜 Historique des Analyses Récentes</h2>
        {history.length === 0 ? (
          <p className="no-data">Aucune analyse pour le moment</p>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date & Heure</th>
                  <th>Plante</th>
                  <th>État</th>
                  <th>Maladie</th>
                  <th>Confiance</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(-15).reverse().map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.timestamp).toLocaleString('fr-FR')}</td>
                    <td>
                      {item.plant_type === 'Tomate' && '🍅'}
                      {item.plant_type === 'Pomme de terre' && '🥔'}
                      {item.plant_type === 'Poivron' && '🌶️'}
                      {' '}{item.plant_type}
                    </td>
                    <td>
                      <span className={`status ${item.is_healthy ? 'healthy' : 'diseased'}`}>
                        {item.is_healthy ? '✅ Saine' : '⚠️ Malade'}
                      </span>
                    </td>
                    <td className="disease-name">{item.disease}</td>
                    <td>
                      <span className="confidence">{item.confidence}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
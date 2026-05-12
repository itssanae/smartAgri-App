import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch('http://localhost:5000/api/stats'),
        fetch('http://localhost:5000/api/history')
      ]);
      
      setStats(await statsRes.json());
      setHistory(await historyRes.json());
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (!stats) return <div className="page">Chargement...</div>;

  return (
    <div className="page">
      <h1>📈 Tableau de Bord</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h2>{stats.total}</h2>
          <p>Total Analyses</p>
        </div>
        <div className="stat-card green">
          <h2>{stats.healthy}</h2>
          <p>Saines</p>
        </div>
        <div className="stat-card red">
          <h2>{stats.diseased}</h2>
          <p>Malades</p>
        </div>
      </div>

      <div className="history">
        <h2>📜 Historique Récent</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Plante</th>
              <th>État</th>
              <th>Confiance</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(-10).reverse().map(item => (
              <tr key={item.id}>
                <td>{new Date(item.timestamp).toLocaleString()}</td>
                <td>{item.plant_type}</td>
                <td className={item.is_healthy ? 'green' : 'red'}>
                  {item.is_healthy ? '✅' : '⚠️'}
                </td>
                <td>{item.confidence}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
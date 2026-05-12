import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Detection from './pages/Detection';
import Chatbot from './pages/Chatbot';
import './App.css';

function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div className="app">
      <nav className="navbar">
        <h1>🌱 Smart Agriculture</h1>
        <div className="nav-links">
          <button onClick={() => setPage('dashboard')} className={page === 'dashboard' ? 'active' : ''}>
            Dashboard
          </button>
          <button onClick={() => setPage('detection')} className={page === 'detection' ? 'active' : ''}>
            Détection
          </button>
          <button onClick={() => setPage('chatbot')} className={page === 'chatbot' ? 'active' : ''}>
            Assistant
          </button>
        </div>
      </nav>

      {page === 'dashboard' && <Dashboard />}
      {page === 'detection' && <Detection />}
      {page === 'chatbot' && <Chatbot />}
    </div>
  );
}

export default App;
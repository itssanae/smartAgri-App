import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const API_URL = 'http://localhost:5000';

function Chatbot() {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: '👋 Bonjour ! Je suis votre assistant agricole.\n\nVous pouvez me parler en français, arabe ou darija marocaine.\nComment puis-je vous aider aujourd\'hui ?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '❌ Erreur: ' + data.error
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Erreur de connexion. Vérifiez que le backend est démarré.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "Quels sont les symptômes du mildiou ?",
    "Comment prévenir les maladies des tomates ?",
    "شنو أعراض الأمراض في الطماطم؟",
    "kifach n3arf ila kano lwra9 mrad?"
  ];

  return (
    <div className="chatbot-page">
      <h1 className="page-title">🤖 Assistant Agricole Intelligent</h1>
      <p className="page-subtitle">
        Disponible en Français, العربية et Darija 🇲🇦
      </p>

      <div className="chat-container">
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Questions rapides */}
        {messages.length === 1 && (
          <div className="quick-questions">
            <p>💡 Questions rapides:</p>
            <div className="quick-buttons">
              {quickQuestions.map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    setInput(q);
                    setTimeout(sendMessage, 100);
                  }}
                  className="quick-btn"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Barre d'input */}
        <div className="input-container">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Posez votre question... (FR / AR / Darija)"
            disabled={loading}
            rows="1"
          />
          <button 
            onClick={sendMessage} 
            disabled={loading || !input.trim()}
            className="send-button"
          >
            {loading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;
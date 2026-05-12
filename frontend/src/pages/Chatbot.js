import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Bonjour ! Je suis votre assistant agricole.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
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
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Erreur de connexion'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page chatbot-page">
      <h1>🤖 Assistant Agricole</h1>
      
      <div className="chat-box">
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {loading && <div className="msg assistant typing">...</div>}
          <div ref={endRef} />
        </div>

        <div className="input-bar">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && send()}
            placeholder="Posez votre question..."
            disabled={loading}
          />
          <button onClick={send} disabled={loading}>➤</button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;
import { useState, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import './Home.css'; // Create this CSS file for styles

function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (input.trim()) {
      const userMessage = { text: input, sender: 'user' };
      setMessages([...messages, userMessage]);
      setInput('');
      setLoading(true);

      try {
        await fetch('http://localhost:3001/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userMessage),
        });

        setTimeout(() => {
          const aiMessage = { text: 'AI hii response placeholder', sender: 'ai' };
          setMessages(prev => [...prev, aiMessage]);
          fetch('http://localhost:3001/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiMessage),
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error sending message:', error);
        setLoading(false);
      }
    }
  };

  const updateMess = (e) => {
   setInput(e.target.value)
  }

  return (
    <div className="home">
      <h1>Chat App</h1>
      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
        </div>
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={updateMess}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default Home;
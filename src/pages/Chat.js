import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chat.css';

function Chat({ onLogout, username }) {
  // State variables
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('token');

  // Load chat sessions when component mounts
  useEffect(() => {
    fetchChatSessions();
  }, []);

  // Load messages when user switches to different chat
  useEffect(() => {
    if (currentSessionId) {
      fetchMessages(currentSessionId);
    }
  }, [currentSessionId]);

  // Fetch all chat sessions for current user
  const fetchChatSessions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/chat-sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatSessions(response.data);
      
      // Select first session if exists
      if (response.data.length > 0) {
        setCurrentSessionId(response.data[0].id);
      } else {
        createNewChat();
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  // Get all messages from selected chat session
  const fetchMessages = async (sessionId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/messages/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
      // Scroll to bottom
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Create new chat session
  const createNewChat = async () => {
    const chatName = prompt('Enter a name for this chat:');
    
    if (chatName === null || chatName.trim() === '') {
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/chat-sessions', 
        { title: chatName.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const newSessionId = response.data.sessionId;
      setCurrentSessionId(newSessionId);
      setMessages([]);
      fetchChatSessions();
    } catch (err) {
      console.error('Error creating chat:', err);
      alert('Error creating chat session');
    }
  };

  // Send message to AI and get response
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentSessionId) return;

    setLoading(true);
    const userMessage = inputMessage;
    setInputMessage('');

    try {
      const response = await axios.post(
        `http://localhost:5000/api/chat/${currentSessionId}`,
        { text: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add user message and AI response
      setMessages([
        ...messages,
        { id: response.data.user.id, text: response.data.user.text, sender: 'user' },
        { id: response.data.ai.id, text: response.data.ai.text, sender: 'ai' },
      ]);

      // Scroll to bottom
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {/* Sidebar with chat sessions */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Chat Sessions</h2>
          <button className="new-chat-btn" onClick={createNewChat}>
            + New Chat
          </button>
        </div>

        <div className="sessions-list">
          {chatSessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
              onClick={() => setCurrentSessionId(session.id)}
            >
              <span className="session-title">{session.title}</span>
              <span className="session-date">
                {new Date(session.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">{username}</div>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>Start a new conversation</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <div className="message-content">{msg.text}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="input-form" onSubmit={sendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={loading || !currentSessionId}
          />
          <button type="submit" disabled={loading || !currentSessionId}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;

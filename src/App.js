import './App.css';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Chat from './pages/Chat';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in when app loads
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (token && username) {
      setIsLoggedIn(true);
      setUsername(username);
    }
    
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    const username = localStorage.getItem('username');
    setUsername(username);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      {isLoggedIn ? (
        <Chat onLogout={handleLogout} username={username} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
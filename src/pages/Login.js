import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

function Login({ onLoginSuccess }) {
  // State variables
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle login or signup form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Choose endpoint based on login or signup
      const endpoint = isSignup ? '/api/register' : '/api/login';
      const response = await axios.post(`http://localhost:5000${endpoint}`, {
        username,
        password,
      });

      // Save token and user info to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('username', response.data.username || username);

      // Notify parent component of successful login
      onLoginSuccess();
    } catch (err) {
      // Show error message to user
      if (err.response?.status === 400) {
        setError(err.response.data.error || 'Invalid input');
      } else if (err.response?.status === 401) {
        setError('Incorrect username or password');
      } else {
        setError(err.response?.data?.error || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Context AI</h1>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : isSignup ? 'Create Account' : 'Login'}
          </button>
        </form>

        <div className="button-group">
          <button
            type="button"
            className="toggle-btn"
            onClick={() => {
              setIsSignup(false);
              setError('');
              setUsername('');
              setPassword('');
            }}
            style={{
              background: !isSignup ? 'blue' : '#666',
            }}
          >
            Login
          </button>
          <button
            type="button"
            className="toggle-btn"
            onClick={() => {
              setIsSignup(true);
              setError('');
              setUsername('');
              setPassword('');
            }}
            style={{
              background: isSignup ? 'blue' : '#666',
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

// ===== DATABASE SETUP =====
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'messages.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (!err) {
    console.log('Connected to SQLite database.');
    
    // Users table - stores user account information
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Chat sessions table - stores conversations
    db.run(`CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT DEFAULT 'Chat',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Messages table - stores individual messages in chats
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chat_session_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      sender TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id)
    )`);
  }
});

// ===== USER FUNCTIONS =====

// Add new user to database
function registerUser(username, passwordHash, callback) {
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, passwordHash], function(err) {
    callback(err, this.lastID);
  });
}

// Find user by username
function getUserByUsername(username, callback) {
  db.get('SELECT * FROM users WHERE username = ?', [username], callback);
}

// Get user info by ID
function getUserById(id, callback) {
  db.get('SELECT id, username, created_at FROM users WHERE id = ?', [id], callback);
}

// ===== CHAT SESSION FUNCTIONS =====

// Create new chat session for user
function createChatSession(userId, title, callback) {
  db.run('INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)', [userId, title], function(err) {
    callback(err, this.lastID);
  });
}

// Get all chat sessions for a user
function getUserChatSessions(userId, callback) {
  db.all('SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC', [userId], callback);
}

// ===== MESSAGE FUNCTIONS =====

// Get all messages from a chat session
function getAllMessages(userId, chatSessionId, callback) {
  db.all('SELECT * FROM messages WHERE user_id = ? AND chat_session_id = ? ORDER BY timestamp ASC', [userId, chatSessionId], callback);
}

// Save a message to database
function saveMessage(userId, chatSessionId, text, sender, callback) {
  db.run('INSERT INTO messages (user_id, chat_session_id, text, sender) VALUES (?, ?, ?, ?)', 
    [userId, chatSessionId, text, sender], 
    function(err) {
      callback(err, this.lastID);
    });
}

// ===== EXPORTS =====
module.exports = { 
  db, 
  registerUser, 
  getUserByUsername, 
  getUserById,
  createChatSession, 
  getUserChatSessions,
  getAllMessages, 
  saveMessage 
};
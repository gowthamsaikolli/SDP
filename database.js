const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'messages.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      sender TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

function getAllMessages(callback) {
  db.all('SELECT * FROM messages ORDER BY timestamp ASC', [], callback);
}

function saveMessage(text, sender, callback) {
  db.run('INSERT INTO messages (text, sender) VALUES (?, ?)', [text, sender], function(err) {
    callback(err, this.lastID);
  });
}

module.exports = { db, getAllMessages, saveMessage };
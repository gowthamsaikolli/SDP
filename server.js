const express = require('express');
const cors = require('cors');
const { getAllMessages, saveMessage } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/messages', (req, res) => {
  getAllMessages((err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/messages', (req, res) => {
  const { text, sender } = req.body;
  if (!text || !sender) {
    return res.status(400).json({ error: 'Text and sender are required' });
  }
  saveMessage(text, sender, (err, id) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id, text, sender });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  const { db } = require('./database');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

// ===== IMPORTS =====
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { 
  registerUser, 
  getUserByUsername, 
  getUserById,
  createChatSession, 
  getUserChatSessions,
  getAllMessages, 
  saveMessage 
} = require('./database');
const { verifyToken, generateToken } = require('./auth');
const axios = require('axios');
require('dotenv').config();

// ===== SETUP =====
const app = express();
const PORT = process.env.PORT || 5000;

// Ollama configuration
const OLLAMA_PORT = process.env.OLLAMA_PORT || 11434;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';
const OLLAMA_URL = `http://localhost:${OLLAMA_PORT}`;

// ===== HELPER FUNCTIONS =====

// Check if Ollama AI service is available
async function checkOllamaHealth() {
  try {
    await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

// Send prompt to Ollama AI and get response
async function queryOllama(prompt, conversationHistory = '') {
  const url = `${OLLAMA_URL}/api/generate`;
  
  const systemInstructions = `You are a helpful AI assistant. Keep responses SHORT (1-2 sentences). No long explanations or repetition. Answer directly and concisely. If unsure, say "I can't do fucker".`;

  // Include previous messages for context
  const fullPrompt = conversationHistory 
    ? `${conversationHistory}\n\nUser: ${prompt}\n\nAssistant:` 
    : prompt + '\n\n' + systemInstructions;

  const payload = {
    model: OLLAMA_MODEL,
    prompt: fullPrompt,
    stream: false,
  };

  try {
    const resp = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    return resp.data.response || resp.data.completion || '';
  } catch (error) {
    console.error('Ollama Error:', error.message);
    throw new Error(`Failed to connect to Ollama at ${OLLAMA_URL}. Make sure Ollama is running with: ollama serve`);
  }
}

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== HEALTH CHECK ROUTES =====

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'running' });
});

app.get('/api/ollama-status', async (req, res) => {
  const isHealthy = await checkOllamaHealth();
  res.json({ 
    ollama_running: isHealthy, 
    url: OLLAMA_URL,
    model: OLLAMA_MODEL 
  });
});

// ===== AUTHENTICATION ROUTES =====

// Register new user
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  // Hash password for security
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({ error: 'Error hashing password' });
    }

    registerUser(username, hash, (err, userId) => {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: err.message });
      }

      const token = generateToken(userId);
      res.status(201).json({ 
        message: 'User registered successfully',
        userId,
        username: username,
        token 
      });
    });
  });
});

// Login user
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Find user by username
  getUserByUsername(username, (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if password matches
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) {
        return res.status(500).json({ error: 'Error comparing passwords' });
      }

      if (!match) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Create token and send response
      const token = generateToken(user.id);
      res.json({ 
        message: 'Login successful',
        userId: user.id,
        username: user.username,
        token 
      });
    });
  });
});

// Get current user info (requires token)
app.get('/api/user', verifyToken, (req, res) => {
  getUserById(req.userId, (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// ===== CHAT SESSION ROUTES =====

// Get all chat sessions for current user
app.get('/api/chat-sessions', verifyToken, (req, res) => {
  getUserChatSessions(req.userId, (err, sessions) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(sessions || []);
  });
});

// Create new chat session for user
app.post('/api/chat-sessions', verifyToken, (req, res) => {
  const { title } = req.body;
  createChatSession(req.userId, title || 'Chat', (err, sessionId) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ 
      message: 'Chat session created',
      sessionId 
    });
  });
});

// ===== MESSAGE ROUTES =====

// Get all messages from a chat session
app.get('/api/messages/:sessionId', verifyToken, (req, res) => {
  const { sessionId } = req.params;
  
  getAllMessages(req.userId, sessionId, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Save a message to database
app.post('/api/messages/:sessionId', verifyToken, (req, res) => {
  const { sessionId } = req.params;
  const { text, sender } = req.body;

  if (!text || !sender) {
    return res.status(400).json({ error: 'Text and sender are required' });
  }

  saveMessage(req.userId, sessionId, text, sender, (err, id) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, text, sender });
  });
});

// ===== CHAT WITH AI ROUTES =====

// Send message and get AI response
app.post('/api/chat/:sessionId', verifyToken, (req, res) => {
  const { sessionId } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  // Save user message to database
  saveMessage(req.userId, sessionId, text, 'user', (err, userId) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get all messages for context
    getAllMessages(req.userId, sessionId, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Build conversation history from all messages
      let conversationHistory = '';
      if (rows && rows.length > 0) {
        conversationHistory = rows
          .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
          .join('\n');
      }

      // Send to Ollama AI and get response
      queryOllama(text, conversationHistory)
        .then((aiText) => {
          // Save AI response to database
          saveMessage(req.userId, sessionId, aiText, 'ai', (err2, aiId) => {
            if (err2) {
              console.error('Error saving AI message:', err2);
            }
            res.json({
              user: { id: userId, text },
              ai: { id: aiId, text: aiText },
            });
          });
        })
        .catch((err2) => {
          res.status(500).json({ error: 'LLM request failed: ' + err2.message });
        });
    });
  });
});

// ===== START SERVER =====

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Check if Ollama AI is available
  const ollamaAvailable = await checkOllamaHealth();
  if (ollamaAvailable) {
    console.log(`✓ Ollama is running at ${OLLAMA_URL} with model ${OLLAMA_MODEL}`);
  } else {
    console.warn(`✗ WARNING: Ollama is not running at ${OLLAMA_URL}`);
    console.warn(`  Please start Ollama with: ollama serve`);
  }
});

// Close database when server stops
process.on('SIGINT', () => {
  const { db } = require('./database');
  db.close((err) => {
    process.exit(0);
  });
});

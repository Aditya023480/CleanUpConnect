const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { getRankTitle } = require('../utils/rank');

const router = express.Router();
const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedUsername) {
    return res.status(400).json({ error: 'Username cannot be empty' });
  }

  try {
    const existingUserByUsername = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
      [normalizedUsername]
    );

    if (existingUserByUsername.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const existingUserByEmail = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );

    if (existingUserByEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await pool.query(
      'INSERT INTO users (username, email, password_hash, role, points) VALUES ($1, $2, $3, $4, 0)',
      [normalizedUsername, normalizedEmail, passwordHash, 'user']
    );

    return res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email or username and password are required' });
  }

  try {
    const userResult = await pool.query(
      'SELECT id, username, email, password_hash, role, points FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1) LIMIT 1',
      [identifier.trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        points: user.points,
      },
      process.env.JWT_SECRET || 'dev_secret_change_me',
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        points: user.points,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to login' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, username, email, role, points, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        ...userResult.rows[0],
        rank: getRankTitle(userResult.rows[0].points),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;

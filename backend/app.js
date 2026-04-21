const express = require('express');
const cors = require('cors');
const eventsRoutes = require('./routes/events');
const authRoutes = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');

require('dotenv').config();

const app = express();

function normalizeOrigin(origin) {
  if (!origin) {
    return '';
  }

  return origin.trim().replace(/\/$/, '').toLowerCase();
}

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  'https://clean-up-connect.vercel.app',
  'https://cleanupconnect.vercel.app',
  'http://localhost:3000',
  'http://localhost:8000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8000',
]
  .map(normalizeOrigin)
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  return (
    allowedOrigins.includes(normalizedOrigin) ||
    normalizedOrigin.endsWith('.vercel.app') ||
    normalizedOrigin.endsWith('.onrender.com') ||
    normalizedOrigin.startsWith('http://localhost') ||
    normalizedOrigin.startsWith('https://localhost') ||
    normalizedOrigin.startsWith('http://127.0.0.1') ||
    normalizedOrigin.startsWith('https://127.0.0.1')
  );
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, origin || true);
      return;
    }

    callback(new Error(`Blocked by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

app.use('/events', eventsRoutes);
app.use('/', authRoutes);
app.use('/leaderboard', leaderboardRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
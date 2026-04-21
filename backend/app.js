const express = require('express');
const eventsRoutes = require('./routes/events');
const authRoutes = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');

require('dotenv').config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  'http://localhost:3000',
  'http://localhost:8000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8000',
].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  return (
    allowedOrigins.includes(origin) ||
    origin.endsWith('.vercel.app') ||
    origin.endsWith('.onrender.com') ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('https://localhost') ||
    origin.startsWith('http://127.0.0.1') ||
    origin.startsWith('https://127.0.0.1')
  );
}

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());

app.use('/events', eventsRoutes);
app.use('/', authRoutes);
app.use('/leaderboard', leaderboardRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
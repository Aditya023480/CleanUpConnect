const express = require('express');
const cors = require('cors');
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

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('https://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('https://127.0.0.1')
      ) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());

app.use('/events', eventsRoutes);
app.use('/', authRoutes);
app.use('/leaderboard', leaderboardRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
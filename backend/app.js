const express = require('express');
const cors = require('cors');
const eventsRoutes = require('./routes/events');
const authRoutes = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/events', eventsRoutes);
app.use('/', authRoutes);
app.use('/leaderboard', leaderboardRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const pool = require('../db');
const { getRankTitle } = require('../utils/rank');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        username,
        email,
        role,
        points,
        created_at,
        ROW_NUMBER() OVER (ORDER BY points DESC, created_at ASC) AS rank_position
      FROM users
      ORDER BY points DESC, created_at ASC, username ASC
    `);

    const users = result.rows.map((user) => ({
      ...user,
      rank_title: getRankTitle(Number(user.points)),
    }));

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

module.exports = router;

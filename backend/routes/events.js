const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// GET /events
router.get('/', async (req, res) => {
  const { state, city } = req.query;
  const requestedPage = Number.parseInt(req.query.page, 10);
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;
  const limit = Number.isNaN(requestedLimit) || requestedLimit < 1 ? 6 : Math.min(requestedLimit, 50);
  const offset = (page - 1) * limit;

  try {
    const values = [];
    let query = `
      SELECT e.*, u.username AS organizer_username, u.points AS organizer_points, COUNT(v.id) as joined_count
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN volunteers v ON e.id = v.event_id
    `;
    const conditions = [];

    if (state) {
      values.push(state);
      conditions.push(`LOWER(TRIM(e.state)) = LOWER(TRIM($${values.length}))`);
    }

    if (city) {
      values.push(city);
      conditions.push(`LOWER(TRIM(e.city)) = LOWER(TRIM($${values.length}))`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM events e
      ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
    `;

    const countResult = await pool.query(countQuery, values);
    const total = countResult.rows[0].total;
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    const paginatedValues = [...values, limit, offset];

    query += ` GROUP BY e.id, u.username, u.points ORDER BY e.created_at DESC LIMIT $${paginatedValues.length - 1} OFFSET $${paginatedValues.length}`;

    const result = await pool.query(query, paginatedValues);
    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_prev: page > 1,
        has_next: page < totalPages,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /events/states
router.get('/states', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT LOWER(TRIM(state)) AS state
      FROM events
      WHERE state IS NOT NULL AND state <> ''
      ORDER BY state ASC
    `);
    res.json(result.rows.map((row) => row.state));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /events/cities?state=xyz
router.get('/cities', async (req, res) => {
  const { state } = req.query;

  if (!state) {
    return res.status(400).json({ error: 'State is required' });
  }

  try {
    const result = await pool.query(`
      SELECT DISTINCT LOWER(TRIM(city)) AS city
      FROM events
      WHERE LOWER(TRIM(state)) = LOWER(TRIM($1)) AND city IS NOT NULL AND city <> ''
      ORDER BY city ASC
    `, [state]);
    res.json(result.rows.map((row) => row.city));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /events
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, state, city, date, volunteers_needed } = req.body;

  if (!title || !state || !city || !date || volunteers_needed === undefined || volunteers_needed === null) {
    return res.status(400).json({ error: 'Title, state, city, date, and volunteers needed are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO events (title, description, state, city, date, volunteers_needed, organizer_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, description || '', state.toLowerCase(), city.toLowerCase(), date, volunteers_needed, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /events/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT e.*, u.username AS organizer_username, u.points AS organizer_points, c.username AS completed_by_username
       FROM events e
       LEFT JOIN users u ON e.organizer_id = u.id
       LEFT JOIN users c ON e.completed_by = c.id
       WHERE e.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /events/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /events/:id/join
router.post('/:id/join', authMiddleware, async (req, res) => {
  const { id } = req.params;
  let client;

  try {
    client = await pool.connect();
    const existingEvent = await client.query('SELECT id, organizer_id, is_completed FROM events WHERE id = $1', [id]);

    if (existingEvent.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (existingEvent.rows[0].is_completed) {
      return res.status(400).json({ error: 'Completed events cannot be joined' });
    }

    if (existingEvent.rows[0].organizer_id === req.user.id) {
      return res.status(400).json({ error: 'Organizer is already part of this event' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      'INSERT INTO volunteers (event_id, user_id) VALUES ($1, $2) RETURNING *',
      [id, req.user.id]
    );

    await client.query('UPDATE users SET points = points + 15 WHERE id = $1', [req.user.id]);

    await client.query('COMMIT');

    res.json(result.rows[0]);
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You have already joined this event' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// POST /events/:id/complete
router.post('/:id/complete', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const eventResult = await client.query(
      'SELECT id, organizer_id, is_completed FROM events WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    if (event.is_completed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Event is already completed' });
    }

    const volunteerResult = await client.query(
      'SELECT user_id FROM volunteers WHERE event_id = $1',
      [id]
    );

    const volunteerIds = volunteerResult.rows.map((row) => row.user_id);

    if (volunteerIds.length > 0) {
      await client.query(
        'UPDATE users SET points = points + 50 WHERE id = ANY($1::int[])',
        [volunteerIds]
      );
    }

    await client.query(
      'UPDATE users SET points = points + 75 WHERE id = $1',
      [event.organizer_id]
    );

    await client.query(
      'UPDATE events SET is_completed = TRUE, completed_at = NOW(), completed_by = $1 WHERE id = $2',
      [req.user.id, id]
    );

    await client.query('COMMIT');

    return res.json({
      message: 'Event marked as completed and points awarded',
      awarded_volunteers: volunteerIds.length,
      organizer_points_awarded: 75,
      volunteer_points_awarded: 50,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: 'Failed to complete event' });
  } finally {
    client.release();
  }
});

// GET /events/:id/volunteers
router.get('/:id/volunteers', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT v.id, v.event_id, v.user_id, v.joined_at, u.username, u.email
       FROM volunteers v
       INNER JOIN users u ON v.user_id = u.id
       WHERE v.event_id = $1
       ORDER BY v.joined_at ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /events/leaderboard-helper rank names not here, but using this file for event-specific data only

module.exports = router;
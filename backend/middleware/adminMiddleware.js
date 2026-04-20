const pool = require('../db');

async function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  try {
    const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const role = String(result.rows[0].role || '').trim().toLowerCase();

    if (role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Keep downstream handlers aligned with the latest role.
    req.user.role = role;
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify admin access' });
  }
}

module.exports = adminMiddleware;

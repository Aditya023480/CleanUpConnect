const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', // Replace with your PostgreSQL username
  host: 'localhost',
  database: 'community_cleaning',
  password: 'postgres', // Replace with your PostgreSQL password
  port: 5432,
});

module.exports = pool;
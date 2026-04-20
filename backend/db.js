const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      user: process.env.PGUSER || 'postgres',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'community_cleaning',
      password: process.env.PGPASSWORD || 'postgres',
      port: Number(process.env.PGPORT || 5432),
    };

const pool = new Pool(poolConfig);

module.exports = pool;
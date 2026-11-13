const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  enableKeepAlive: true,
  // the cloud database requires an encrypted connection; local MySQL does not
  ssl: process.env.DB_SSL === 'true'
    ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    : undefined,
});

module.exports = pool;
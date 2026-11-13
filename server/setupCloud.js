require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db');

const host = process.env.DB_HOST || '';
if (!host || host === 'localhost' || host === '127.0.0.1') {
  console.log('This script is for the CLOUD database. Check that .env.cloud was loaded.');
  process.exit(1);
}
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.log('Please set ADMIN_EMAIL and ADMIN_PASSWORD in .env.cloud first.');
  process.exit(1);
}

async function run(sql) {
  try {
    await db.query(sql);
  } catch (err) {
    console.log('  skipped:', err.code || err.message);
  }
}

(async () => {
  console.log('Database host:', host);
  console.log('Creating tables...');
  const schema = fs
    .readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8')
    .replace(/^\s*(CREATE DATABASE|USE)\b.*$/gim, '');
  const statements = schema.split(';').map((s) => s.trim()).filter(Boolean);
  for (const sql of statements) await run(sql);

  console.log('Opening the application period...');
  await db.query("UPDATE settings SET application_end = '2030-12-31' WHERE id = 1");

  console.log('Creating demo accounts...');
  const accounts = [
    {
      name: 'PSP Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
      studentNo: null,
    },
    {
      name: 'Demo Student',
      email: 'student@demo.psp',
      password: 'DemoStudent123!',
      role: 'student',
      studentNo: '202600000',
    },
  ];

  for (const a of accounts) {
    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [a.email]);
    if (exists.length) {
      console.log(`  already exists: ${a.email}`);
      continue;
    }
    const hash = await bcrypt.hash(a.password, 10);
    const [result] = await db.query(
      'INSERT INTO users (student_no, full_name, email, password_hash, role) VALUES (?,?,?,?,?)',
      [a.studentNo, a.name, a.email, hash, a.role]
    );
    if (a.role === 'student') {
      await db.query('INSERT INTO applications (user_id) VALUES (?)', [result.insertId]);
    }
    console.log(`  created: ${a.email}`);
  }

  console.log('Done.');
  process.exit(0);
})().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
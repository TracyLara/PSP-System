const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}

// REGISTER (students only)
router.post('/register', async (req, res) => {
  try {
    const { student_no, full_name, email, password } = req.body;

    if (!student_no || !full_name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR student_no = ?',
      [email, student_no]
    );
    if (existing.length) {
      return res.status(409).json({ message: 'Email or student number already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (student_no, full_name, email, password_hash) VALUES (?,?,?,?)',
      [student_no, full_name, email, hash]
    );

    // one application per student, created automatically
    await db.query('INSERT INTO applications (user_id) VALUES (?)', [result.insertId]);

    const user = { id: result.insertId, role: 'student', full_name, email };
    res.status(201).json({ token: makeToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN (students and admins)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    res.json({
      token: makeToken(user),
      user: { id: user.id, role: user.role, full_name: user.full_name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// WHO AM I
router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, student_no, full_name, email, role FROM users WHERE id = ?',
    [req.user.id]
  );
  res.json(rows[0]);
});

module.exports = router;

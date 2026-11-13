const express = require('express');
const db = require('../db');

const router = express.Router();

// simple spam guard: max 5 messages per IP per hour
const hits = new Map();
const HOUR = 60 * 60 * 1000;

router.post('/', async (req, res) => {
  try {
    const now = Date.now();
    const recent = (hits.get(req.ip) || []).filter((t) => now - t < HOUR);
    if (recent.length >= 5) {
      return res.status(429).json({ message: 'Too many messages. Please try again later.' });
    }

    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim();
    const subject = (req.body.subject || '').trim();
    const message = (req.body.message || '').trim();

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (name.length > 100 || subject.length > 150 || message.length > 2000) {
      return res.status(400).json({ message: 'One of the fields is too long' });
    }

    await db.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?,?,?,?)',
      [name, email, subject, message]
    );

    recent.push(now);
    hits.set(req.ip, recent);
    res.status(201).json({ message: 'Message sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
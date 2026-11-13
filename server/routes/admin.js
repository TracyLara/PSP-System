const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin); // every route below is admin-only

const REQUIRED_DOCS = 5;

// which status can move to which
const TRANSITIONS = {
  complete: ['form_released'],
  form_released: ['submitted_to_governor'],
  submitted_to_governor: ['approved', 'denied'],
};

function fail(res, err) {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
}

// ---------- OVERVIEW ----------
router.get('/stats', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT status, COUNT(*) AS count FROM applications GROUP BY status'
    );
    const byStatus = {};
    rows.forEach((r) => { byStatus[r.status] = Number(r.count); });

    const [[students]] = await db.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'student'"
    );
    const [[unread]] = await db.query(
      'SELECT COUNT(*) AS count FROM contact_messages WHERE is_read = 0'
    );
    res.json({
      byStatus,
      students: Number(students.count),
      unreadMessages: Number(unread.count),
    });
  } catch (err) {
    fail(res, err);
  }
});

// ---------- APPLICATIONS ----------
router.get('/applications', async (req, res) => {
  try {
    const status = String(req.query.status || 'all');
    const q = String(req.query.q || '').trim();

    const where = [];
    const params = [];

    if (status !== 'all') {
      where.push('a.status = ?');
      params.push(status);
    } else {
      where.push("a.status <> 'draft'");
    }
    if (q) {
      where.push('(u.full_name LIKE ? OR u.student_no LIKE ? OR a.reference_no LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    const [rows] = await db.query(
      `SELECT a.id, a.reference_no, a.status, a.submitted_at,
              u.full_name, u.student_no, u.email,
              (SELECT COUNT(*) FROM documents d WHERE d.application_id = a.id) AS docs_uploaded,
              (SELECT COUNT(*) FROM documents d
                 WHERE d.application_id = a.id AND d.status = 'approved') AS docs_approved
       FROM applications a
       JOIN users u ON u.id = a.user_id
       WHERE ${where.join(' AND ')}
       ORDER BY (a.submitted_at IS NULL), a.submitted_at ASC, a.id DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    fail(res, err);
  }
});

router.get('/applications/:id', async (req, res) => {
  try {
    const [apps] = await db.query(
      `SELECT a.id, a.reference_no, a.status, a.submitted_at,
              u.full_name, u.student_no, u.email
       FROM applications a
       JOIN users u ON u.id = a.user_id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (!apps.length) return res.status(404).json({ message: 'Not found' });

    const [documents] = await db.query(
      'SELECT id, type, status, admin_remark, uploaded_at FROM documents WHERE application_id = ?',
      [req.params.id]
    );
    res.json({ application: apps[0], documents });
  } catch (err) {
    fail(res, err);
  }
});

// approve / reject / reset ONE document (only while Pending Review)
router.patch('/documents/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const remark = String(req.body.remark || '').trim();

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    if (status === 'rejected' && !remark) {
      return res.status(400).json({ message: 'Please write a remark so the student knows what to fix' });
    }
    if (remark.length > 255) {
      return res.status(400).json({ message: 'Remark is too long (max 255 characters)' });
    }

    const [rows] = await db.query(
      `SELECT d.id, a.status AS app_status
       FROM documents d JOIN applications a ON a.id = d.application_id
       WHERE d.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Document not found' });
    if (rows[0].app_status !== 'pending_review') {
      return res.status(409).json({
        message: 'Documents can only be reviewed while the application is Pending Review',
      });
    }

    await db.query('UPDATE documents SET status = ?, admin_remark = ? WHERE id = ?', [
      status,
      status === 'rejected' ? remark : null,
      req.params.id,
    ]);
    res.json({ message: 'Updated' });
  } catch (err) {
    fail(res, err);
  }
});

// finish the review: Complete, or back to the student for correction
router.post('/applications/:id/finalize', async (req, res) => {
  try {
    const [apps] = await db.query('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    const app = apps[0];
    if (!app) return res.status(404).json({ message: 'Not found' });
    if (app.status !== 'pending_review') {
      return res.status(409).json({ message: 'This application is not waiting for review' });
    }

    const [docs] = await db.query('SELECT status FROM documents WHERE application_id = ?', [app.id]);
    if (docs.length < REQUIRED_DOCS) {
      return res.status(409).json({ message: 'Not all documents are uploaded' });
    }
    if (docs.some((d) => d.status === 'pending')) {
      return res.status(400).json({ message: 'Please approve or reject every document first' });
    }

    const next = docs.some((d) => d.status === 'rejected') ? 'needs_correction' : 'complete';
    await db.query('UPDATE applications SET status = ? WHERE id = ?', [next, app.id]);
    res.json({ status: next });
  } catch (err) {
    fail(res, err);
  }
});

// move an application forward: release form, submit to governor, approve / deny
router.post('/applications/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const [apps] = await db.query('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    const app = apps[0];
    if (!app) return res.status(404).json({ message: 'Not found' });

    const allowed = TRANSITIONS[app.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'That change is not allowed from the current status' });
    }

    await db.query('UPDATE applications SET status = ? WHERE id = ?', [status, app.id]);
    res.json({ status });
  } catch (err) {
    fail(res, err);
  }
});

// ---------- SETTINGS ----------
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DATE_FORMAT(application_start, '%Y-%m-%d') AS application_start,
              DATE_FORMAT(application_end, '%Y-%m-%d') AS application_end
       FROM settings WHERE id = 1`
    );
    res.json(rows[0] || { application_start: '', application_end: '' });
  } catch (err) {
    fail(res, err);
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { application_start, application_end } = req.body;
    const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');

    if (!isDate(application_start) || !isDate(application_end)) {
      return res.status(400).json({ message: 'Please enter both dates' });
    }
    if (application_start > application_end) {
      return res.status(400).json({ message: 'The start date must be on or before the end date' });
    }

    await db.query(
      'UPDATE settings SET application_start = ?, application_end = ? WHERE id = 1',
      [application_start, application_end]
    );
    res.json({ message: 'Saved' });
  } catch (err) {
    fail(res, err);
  }
});

// ---------- CONTACT MESSAGES ----------
router.get('/messages', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    fail(res, err);
  }
});

router.patch('/messages/:id', async (req, res) => {
  try {
    await db.query('UPDATE contact_messages SET is_read = ? WHERE id = ?', [
      req.body.is_read ? 1 : 0,
      req.params.id,
    ]);
    res.json({ message: 'Updated' });
  } catch (err) {
    fail(res, err);
  }
});

module.exports = router;
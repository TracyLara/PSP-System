const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { upload, TYPES } = require('../middleware/upload');

const router = express.Router();
const EDITABLE = ['draft', 'needs_correction'];

async function isPeriodOpen() {
  const [rows] = await db.query(
    'SELECT 1 FROM settings WHERE id = 1 AND CURDATE() BETWEEN application_start AND application_end'
  );
  return rows.length > 0;
}

function discard(file) {
  if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
}

router.get('/application/me', requireAuth, async (req, res) => {
  try {
    const [apps] = await db.query('SELECT * FROM applications WHERE user_id = ?', [req.user.id]);
    const application = apps[0];
    if (!application) return res.status(404).json({ message: 'No application found' });

    const [documents] = await db.query(
      'SELECT id, type, status, admin_remark, uploaded_at FROM documents WHERE application_id = ?',
      [application.id]
    );
    const [period] = await db.query(
      `SELECT DATE_FORMAT(application_start, '%Y-%m-%d') AS application_start,
              DATE_FORMAT(application_end, '%Y-%m-%d') AS application_end,
              (CURDATE() BETWEEN application_start AND application_end) AS is_open
       FROM settings WHERE id = 1`
    );
    res.json({ application, documents, period: period[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/documents/:type',
  requireAuth,
  (req, res, next) => {
    if (!TYPES.includes(req.params.type)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }
    upload.single('file')(req, res, (err) => {
      if (err) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5 MB)' : err.message;
        return res.status(400).json({ message });
      }
      next();
    });
  },
  async (req, res) => {
    const file = req.file;
    try {
      if (!file) return res.status(400).json({ message: 'No file uploaded' });

      const fd = fs.openSync(file.path, 'r');
      const buf = Buffer.alloc(5);
      fs.readSync(fd, buf, 0, 5, 0);
      fs.closeSync(fd);
      if (buf.toString() !== '%PDF-') {
        discard(file);
        return res.status(400).json({ message: 'That file is not a valid PDF' });
      }

      if (!(await isPeriodOpen())) {
        discard(file);
        return res.status(403).json({ message: 'The application period is closed' });
      }

      const [apps] = await db.query('SELECT * FROM applications WHERE user_id = ?', [req.user.id]);
      const application = apps[0];
      if (!application || !EDITABLE.includes(application.status)) {
        discard(file);
        return res.status(409).json({ message: 'Your application is already submitted' });
      }

      const relPath = `uploads/${req.user.id}/${file.filename}`;
      const [existing] = await db.query(
        'SELECT id, file_path, status FROM documents WHERE application_id = ? AND type = ?',
        [application.id, req.params.type]
      );

      if (existing.length) {
        if (existing[0].status === 'approved') {
          discard(file);
          return res.status(409).json({ message: 'This document is already approved' });
        }
        const oldFile = path.join(__dirname, '..', existing[0].file_path);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
        await db.query(
          `UPDATE documents SET file_path = ?, status = 'pending', admin_remark = NULL,
           uploaded_at = NOW() WHERE id = ?`,
          [relPath, existing[0].id]
        );
      } else {
        await db.query(
          'INSERT INTO documents (application_id, type, file_path) VALUES (?,?,?)',
          [application.id, req.params.type, relPath]
        );
      }
      res.json({ message: 'Uploaded' });
    } catch (err) {
      discard(file);
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);


router.get('/documents/:id/file', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.file_path, a.user_id FROM documents d
       JOIN applications a ON a.id = d.application_id WHERE d.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    res.sendFile(path.join(__dirname, '..', rows[0].file_path));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/application/submit', requireAuth, async (req, res) => {
  try {
    const [apps] = await db.query('SELECT * FROM applications WHERE user_id = ?', [req.user.id]);
    const application = apps[0];

    if (!application || !EDITABLE.includes(application.status)) {
      return res.status(409).json({ message: 'Your application is already submitted' });
    }
    if (!(await isPeriodOpen())) {
      return res.status(403).json({ message: 'The application period is closed' });
    }

    const [docs] = await db.query(
      'SELECT type, status FROM documents WHERE application_id = ?',
      [application.id]
    );
    const missing = TYPES.filter((t) => !docs.find((d) => d.type === t));
    if (missing.length) {
      return res.status(400).json({ message: 'Please upload all 5 requirements first' });
    }
    if (docs.some((d) => d.status === 'rejected')) {
      return res.status(400).json({ message: 'Please replace the rejected documents first' });
    }

    const ref = application.reference_no || `PSP-2026-${String(application.id).padStart(5, '0')}`;
    await db.query(
      `UPDATE applications SET status = 'pending_review', submitted_at = NOW(), reference_no = ?
       WHERE id = ?`,
      [ref, application.id]
    );
    res.json({ message: 'Submitted', reference_no: ref });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
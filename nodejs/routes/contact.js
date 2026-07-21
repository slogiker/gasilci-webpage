import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const CONTACT_EMAIL = 'info@pgd-majsperk-breg.si';

router.get('/', requireAuth, (req, res) => {
    try {
        const items = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    try {
        db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
        res.json({ success: true, data: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, error: 'Vsa polja so obvezna' });
    }

    try {
        const stmt = db.prepare('INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)');
        const resolvedSubject = subject || 'Novo sporočilo s spletne strani';
        stmt.run(name, email, resolvedSubject, message);

        console.log(`[Contact Email sent to ${CONTACT_EMAIL}]:
From: ${email}
Subject: ${resolvedSubject}
Message: ${message}`);

        res.json({ success: true, data: 'Sporočilo poslano' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;

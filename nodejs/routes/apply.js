import express from 'express';
import db from '../db.js';

const router = express.Router();
const CONTACT_EMAIL = 'info@pgd-majsperk-breg.si';

router.post('/', (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email) {
        return res.status(400).json({ success: false, error: 'Ime in email sta obvezna' });
    }

    try {
        const stmt = db.prepare('INSERT INTO applications (name, email, phone, message) VALUES (?, ?, ?, ?)');
        stmt.run(name, email, phone || '', message || '');

        console.log(`[Email application sent to ${CONTACT_EMAIL}]:
From: ${email}
Phone: ${phone}
Subject: Nova prijava za članstvo: ${name}
Message: ${message}`);

        res.json({ success: true, message: 'Prijava uspešno oddana' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;

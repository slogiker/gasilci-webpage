import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (req, res) => {
    try {
        const items = db.prepare('SELECT * FROM events ORDER BY event_date ASC').all();
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const item = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
        if (item) {
            res.json({ success: true, data: item });
        } else {
            res.status(404).json({ success: false, error: 'Event not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', requireAuth, (req, res) => {
    const { title, description, event_date, location } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO events (title, description, event_date, location) VALUES (?, ?, ?, ?)');
        const info = stmt.run(
            title || '',
            description || '',
            event_date || null,
            location || ''
        );
        res.json({ success: true, data: { id: info.lastInsertRowid } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { title, description, event_date, location } = req.body;
    try {
        const stmt = db.prepare('UPDATE events SET title = ?, description = ?, event_date = ?, location = ? WHERE id = ?');
        stmt.run(
            title || '',
            description || '',
            event_date || null,
            location || '',
            id
        );
        res.json({ success: true, data: 'Updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    try {
        db.prepare('DELETE FROM events WHERE id = ?').run(id);
        res.json({ success: true, data: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;

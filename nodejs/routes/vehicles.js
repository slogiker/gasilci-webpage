import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (req, res) => {
    try {
        const items = db.prepare('SELECT * FROM vehicles ORDER BY year DESC').all();
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const item = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
        if (item) {
            res.json({ success: true, data: item });
        } else {
            res.status(404).json({ success: false, error: 'Vehicle not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', requireAuth, (req, res) => {
    const { name, description, image, year } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO vehicles (name, description, image, year) VALUES (?, ?, ?, ?)');
        const info = stmt.run(
            name || '',
            description || '',
            image || null,
            year || null
        );
        res.json({ success: true, data: { id: info.lastInsertRowid } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { name, description, image, year } = req.body;
    try {
        const stmt = db.prepare('UPDATE vehicles SET name = ?, description = ?, image = ?, year = ? WHERE id = ?');
        stmt.run(
            name || '',
            description || '',
            image || null,
            year || null,
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
        db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
        res.json({ success: true, data: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;

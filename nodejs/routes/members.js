import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (req, res) => {
    try {
        const items = db.prepare('SELECT * FROM members ORDER BY name ASC').all();
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const item = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
        if (item) {
            res.json({ success: true, data: item });
        } else {
            res.status(404).json({ success: false, error: 'Member not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', requireAuth, (req, res) => {
    const { name, rank, role, image, vulkan_id } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO members (name, rank, role, image, vulkan_id) VALUES (?, ?, ?, ?, ?)');
        const info = stmt.run(
            name || '',
            rank || '',
            role || '',
            image || null,
            vulkan_id || ''
        );
        res.json({ success: true, data: { id: info.lastInsertRowid } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { name, rank, role, image, vulkan_id } = req.body;
    try {
        const stmt = db.prepare('UPDATE members SET name = ?, rank = ?, role = ?, image = ?, vulkan_id = ? WHERE id = ?');
        stmt.run(
            name || '',
            rank || '',
            role || '',
            image || null,
            vulkan_id || '',
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
        db.prepare('DELETE FROM members WHERE id = ?').run(id);
        res.json({ success: true, data: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;

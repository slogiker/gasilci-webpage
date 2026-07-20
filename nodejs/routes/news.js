import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (req, res) => {
    try {
        const items = db.prepare('SELECT * FROM news ORDER BY created_at DESC').all();
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const item = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
        if (item) {
            res.json({ success: true, data: item });
        } else {
            res.status(404).json({ success: false, error: 'News not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', requireAuth, (req, res) => {
    const { title, category, content, image } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO news (title, category, content, image, author_id) VALUES (?, ?, ?, ?, ?)');
        const info = stmt.run(
            title || '',
            category || 'Novice',
            content || '',
            image || null,
            req.user.userId
        );
        res.json({ success: true, data: { id: info.lastInsertRowid } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { title, category, content, image } = req.body;
    try {
        const stmt = db.prepare('UPDATE news SET title = ?, category = ?, content = ?, image = ? WHERE id = ?');
        stmt.run(
            title || '',
            category || 'Novice',
            content || '',
            image || null,
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
        db.prepare('DELETE FROM news WHERE id = ?').run(id);
        res.json({ success: true, data: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;

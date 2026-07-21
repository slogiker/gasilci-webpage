import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
    try {
        const items = db.prepare('SELECT id, email, username, role, created_at FROM users ORDER BY email ASC').all();
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', requireAuth, (req, res) => {
    const { email, username, password, role } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'E-pošta in geslo sta obvezna' });
    }

    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const stmt = db.prepare('INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)');
        const info = stmt.run(email, username || email.split('@')[0], hashedPassword, role || 'admin');
        res.json({ success: true, data: { id: info.lastInsertRowid } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Napaka pri shranjevanju uporabnika' });
    }
});

router.put('/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { email, username, password, role } = req.body;

    try {
        if (password && password.trim() !== '') {
            const hashedPassword = bcrypt.hashSync(password, 10);
            const stmt = db.prepare('UPDATE users SET email = ?, username = ?, password = ?, role = ? WHERE id = ?');
            stmt.run(email, username, hashedPassword, role, id);
        } else {
            const stmt = db.prepare('UPDATE users SET email = ?, username = ?, role = ? WHERE id = ?');
            stmt.run(email, username, role, id);
        }
        res.json({ success: true, data: 'Uporabnik uspešno posodobljen' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Napaka pri posodabljanju uporabnika' });
    }
});

router.delete('/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    if (parseInt(id) === req.user.userId) {
        return res.status(400).json({ success: false, error: 'Ne morete izbrisati samega sebe' });
    }

    try {
        db.prepare('DELETE FROM users WHERE id = ?').run(id);
        res.json({ success: true, data: 'Uporabnik uspešno izbrisan' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;

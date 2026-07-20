import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_this_in_production';

router.post('/login', (req, res) => {
    const { email, password } = req.body; // email can be email or username
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Prosimo vnesite e-pošto/uporabniško ime in geslo' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(email, email);
    if (!user) {
        return res.status(401).json({ success: false, error: 'Uporabnik ne obstaja' });
    }

    if (bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            role: user.role || 'admin'
        }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            role: user.role || 'admin'
        });
    } else {
        res.status(401).json({ success: false, error: 'Napačno geslo' });
    }
});

export default router;

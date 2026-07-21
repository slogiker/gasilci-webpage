import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const tempDir = path.join(__dirname, '../temp_uploads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const upload = multer({ 
    dest: tempDir,
    limits: { fileSize: 50 * 1024 * 1024 }
});

const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

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

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
    const { title, description, event_date, location } = req.body;
    let image_path = req.body.image || null;

    try {
        if (req.file) {
            const tempPath = req.file.path;
            const ext = path.extname(req.file.originalname) || '.jpg';
            const filename = `event-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
            const targetPath = path.join(uploadsDir, filename);

            const image = sharp(tempPath);
            const metadata = await image.metadata();
            
            if (metadata.width && metadata.width > 1200) {
                await image.resize({ width: 1200 }).toFile(targetPath);
            } else {
                await fs.promises.copyFile(tempPath, targetPath);
            }
            
            await fs.promises.unlink(tempPath).catch(() => {});
            image_path = 'uploads/' + filename;
        }

        const stmt = db.prepare('INSERT INTO events (title, description, event_date, location, image) VALUES (?, ?, ?, ?, ?)');
        const info = stmt.run(
            title || '',
            description || '',
            event_date || null,
            location || '',
            image_path
        );
        res.json({ success: true, data: { id: info.lastInsertRowid } });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) {
            await fs.promises.unlink(req.file.path).catch(() => {});
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { title, description, event_date, location, current_image } = req.body;

    try {
        const item = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
        if (!item) return res.status(404).json({ success: false, error: 'Event not found' });

        let image_path = item.image || current_image || null;

        if (req.file) {
            const tempPath = req.file.path;
            const ext = path.extname(req.file.originalname) || '.jpg';
            const filename = `event-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
            const targetPath = path.join(uploadsDir, filename);

            const image = sharp(tempPath);
            const metadata = await image.metadata();
            
            if (metadata.width && metadata.width > 1200) {
                await image.resize({ width: 1200 }).toFile(targetPath);
            } else {
                await fs.promises.copyFile(tempPath, targetPath);
            }
            
            await fs.promises.unlink(tempPath).catch(() => {});
            image_path = 'uploads/' + filename;
        }

        const stmt = db.prepare('UPDATE events SET title = ?, description = ?, event_date = ?, location = ?, image = ? WHERE id = ?');
        stmt.run(
            title || '',
            description || '',
            event_date || null,
            location || '',
            image_path,
            id
        );
        res.json({ success: true, data: 'Updated successfully' });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) {
            await fs.promises.unlink(req.file.path).catch(() => {});
        }
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

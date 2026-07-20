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

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../temp_uploads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer upload to temp directory
const upload = multer({ 
    dest: tempDir,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

router.get('/', (req, res) => {
    try {
        const items = db.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all();
        res.json({ success: true, data: items });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image uploaded' });
    }

    const { title, category } = req.body;
    const tempPath = req.file.path;
    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    const targetPath = path.join(uploadsDir, filename);

    try {
        // Resize with sharp if width > 1200
        const image = sharp(tempPath);
        const metadata = await image.metadata();
        
        if (metadata.width && metadata.width > 1200) {
            await image.resize({ width: 1200 }).toFile(targetPath);
        } else {
            await fs.promises.copyFile(tempPath, targetPath);
        }
        
        // Clean up temp file
        await fs.promises.unlink(tempPath);

        const stmt = db.prepare('INSERT INTO gallery (title, image_path, category) VALUES (?, ?, ?)');
        const info = stmt.run(title || '', 'api/uploads/' + filename, category || '');

        res.json({ success: true, data: { id: info.lastInsertRowid } });
    } catch (err) {
        // Clean up temp file in case of error
        if (fs.existsSync(tempPath)) {
            await fs.promises.unlink(tempPath).catch(() => {});
        }
        res.status(500).json({ success: false, error: 'Failed to process image: ' + err.message });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const item = db.prepare('SELECT image_path FROM gallery WHERE id = ?').get(id);
        if (!item) {
            return res.status(404).json({ success: false, error: 'Image not found' });
        }

        // Remove file path api/uploads/ -> public/uploads/
        const filename = path.basename(item.image_path);
        const fullPath = path.join(uploadsDir, filename);
        
        if (fs.existsSync(fullPath)) {
            await fs.promises.unlink(fullPath).catch(() => {});
        }

        db.prepare('DELETE FROM gallery WHERE id = ?').run(id);
        res.json({ success: true, data: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;

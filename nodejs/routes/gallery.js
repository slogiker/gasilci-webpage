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
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
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

router.post('/', requireAuth, (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, error: err.message || 'Upload error' });
        }
        next();
    });
}, async (req, res) => {
    const files = req.files || [];
    if (files.length === 0) {
        return res.status(400).json({ success: false, error: 'No images uploaded' });
    }

    const { title, category } = req.body;
    const insertedIds = [];

    try {
        const stmt = db.prepare('INSERT INTO gallery (title, image_path, category) VALUES (?, ?, ?)');
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const tempPath = file.path;
            const ext = path.extname(file.originalname) || '.jpg';
            const filename = `${Date.now()}-${i}-${Math.round(Math.random() * 1E9)}${ext}`;
            const targetPath = path.join(uploadsDir, filename);

            try {
                const image = sharp(tempPath);
                const metadata = await image.metadata();
                
                if (metadata.width && metadata.width > 1200) {
                    await image.resize({ width: 1200 }).toFile(targetPath);
                } else {
                    await fs.promises.copyFile(tempPath, targetPath);
                }
                
                await fs.promises.unlink(tempPath).catch(() => {});

                const baseName = path.basename(file.originalname, ext);
                const fileTitle = (files.length === 1 && title && title.trim()) 
                    ? title.trim() 
                    : (title && title.trim() ? `${title.trim()} (${i+1})` : baseName);

                const info = stmt.run(fileTitle, 'uploads/' + filename, category || '');
                insertedIds.push(info.lastInsertRowid);
            } catch (err) {
                if (fs.existsSync(tempPath)) {
                    await fs.promises.unlink(tempPath).catch(() => {});
                }
                console.error('Error processing file in batch upload:', err);
            }
        }

        res.json({ success: true, count: insertedIds.length, data: { ids: insertedIds } });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to process images: ' + err.message });
    }
});

router.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const item = db.prepare('SELECT * FROM gallery WHERE id = ?').get(id);
        if (!item) return res.status(404).json({ success: false, error: 'Image not found' });
        res.json({ success: true, data: item });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { title, category } = req.body;

    try {
        const item = db.prepare('SELECT * FROM gallery WHERE id = ?').get(id);
        if (!item) return res.status(404).json({ success: false, error: 'Image not found' });

        let image_path = item.image_path;

        if (req.file) {
            const tempPath = req.file.path;
            const ext = path.extname(req.file.originalname) || '.jpg';
            const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
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

        const stmt = db.prepare('UPDATE gallery SET title = ?, category = ?, image_path = ? WHERE id = ?');
        stmt.run(title || '', category || '', image_path, id);

        res.json({ success: true, data: 'Updated successfully' });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) {
            await fs.promises.unlink(req.file.path).catch(() => {});
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const item = db.prepare('SELECT image_path FROM gallery WHERE id = ?').get(id);
        if (!item) {
            return res.status(404).json({ success: false, error: 'Image not found' });
        }

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

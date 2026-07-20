import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image uploaded' });
    }

    const tempPath = req.file.path;
    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    const targetPath = path.join(uploadsDir, filename);

    try {
        await fs.promises.copyFile(tempPath, targetPath);
        await fs.promises.unlink(tempPath);
        
        res.json({
            success: true,
            data: {
                url: 'api/uploads/' + filename
            }
        });
    } catch (err) {
        if (fs.existsSync(tempPath)) {
            await fs.promises.unlink(tempPath).catch(() => {});
        }
        res.status(500).json({ success: false, error: 'Failed to save image: ' + err.message });
    }
});

export default router;

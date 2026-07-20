import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import newsRoutes from './routes/news.js';
import galleryRoutes from './routes/gallery.js';
import eventsRoutes from './routes/events.js';
import membersRoutes from './routes/members.js';
import vehiclesRoutes from './routes/vehicles.js';
import applyRoutes from './routes/apply.js';
import contactRoutes from './routes/contact.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploads statically on /api/uploads
app.use('/api/uploads', express.static(path.join(__dirname, 'public/uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/apply', applyRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);

// Fallback for 404 on API endpoints
app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Handle 404 by redirecting or serving index.html
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

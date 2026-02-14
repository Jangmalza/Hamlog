import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

// Config
import { uploadDir } from './config/paths.js';
import { resolveCorsOptions } from './config/security.js';

// Routers
import { categoryRouter } from './routes/categories.js';
import { postRouter } from './routes/posts.js';
import { profileRouter } from './routes/profile.js';
import { uploadRouter } from './routes/uploads.js';
import { healthRouter } from './routes/health.js';
import { seoRouter } from './routes/seo.js';
import { commentRouter } from './routes/comments.js';
import { authRouter } from './routes/auth.js';
import { previewRouter } from './routes/preview.js';
import { searchPosts } from './controllers/searchController.js';
import { injectPostMeta } from './controllers/seoController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors((req, callback) => {
    callback(null, resolveCorsOptions(req));
}));
app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Static Files
app.use('/uploads', express.static(uploadDir));
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.use('/api', healthRouter);
app.use('/api/posts', postRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/profile', profileRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/comments', commentRouter);
app.use('/api/auth', authRouter);
app.use('/api', previewRouter);
app.get('/api/search', searchPosts);
app.get(['/posts/:slug', '/p/:slug'], injectPostMeta);
app.use('/', seoRouter);

// Fallback for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

export default app;

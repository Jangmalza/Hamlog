import express from 'express';
import cors from 'cors';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Config
import { uploadDir } from './config/paths.js';

// Routers
import { categoryRouter } from './routes/categories.js';
import { postRouter } from './routes/posts.js';
import { profileRouter } from './routes/profile.js';
import { uploadRouter } from './routes/uploads.js';
import { healthRouter } from './routes/health.js';
import { seoRouter } from './routes/seo.js';
import { commentRouter } from './routes/comments.js';

// Initialization
import { ensurePostsFile } from './models/postModel.js';
import { ensureCategoriesFile } from './models/categoryModel.js';
import { ensureProfileFile } from './models/profileModel.js';
import { ensureCommentsFile } from './models/commentModel.js';

// Constants
const PORT = process.env.PORT ?? 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
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
app.use('/', seoRouter);

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Server Start
async function start() {
  try {
    await ensurePostsFile();
    await ensureCategoriesFile();
    await ensureProfileFile();
    await ensureCommentsFile();
    await mkdir(uploadDir, { recursive: true });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API server listening on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

start();

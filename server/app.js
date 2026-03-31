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
import { readSpaIndexHtml, resolveSpaIndexPath } from './utils/spaIndex.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const replaceHeadTag = (html, pattern, replacement) => (
    pattern.test(html)
        ? html.replace(pattern, replacement)
        : html.replace('</head>', `  ${replacement}\n</head>`)
);
const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const injectGoogleSiteVerification = (html) => {
    const verification = String(process.env.GOOGLE_SITE_VERIFICATION ?? '').trim();

    if (!verification) {
        return html;
    }

    return replaceHeadTag(
        html,
        /<meta name="google-site-verification" content=".*?" \/>/,
        `<meta name="google-site-verification" content="${escapeHtml(verification)}" />`
    );
};

const injectNoindexAppShell = async (req, res, next) => {
    try {
        let html = await readSpaIndexHtml();
        html = injectGoogleSiteVerification(html);
        html = replaceHeadTag(
            html,
            /<meta name="robots" content=".*?" \/>/,
            '<meta name="robots" content="noindex, nofollow" />'
        );

        res
            .set('X-Robots-Tag', 'noindex, nofollow')
            .send(html);
    } catch (error) {
        next(error);
    }
};

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

app.get('/', async (req, res, next) => {
    try {
        res.send(injectGoogleSiteVerification(await readSpaIndexHtml()));
    } catch (error) {
        next(error);
    }
});

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
app.get(/^\/admin(?:\/.*)?$/, injectNoindexAppShell);
app.get(['/posts/:slug', '/p/:slug'], injectPostMeta);
app.use('/', seoRouter);

// Fallback for SPA
app.get('*', async (req, res, next) => {
    try {
        res.sendFile(await resolveSpaIndexPath());
    } catch (error) {
        next(error);
    }
});

export default app;

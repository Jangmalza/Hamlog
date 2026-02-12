import { randomUUID } from 'crypto';
import { trackAndGetVisitorStats } from '../services/visitorService.js';

const COOKIE_NAME = 'hamlog_vid';
const VISITOR_ID_PATTERN = /^[a-f0-9-]{16,64}$/i;

function resolveVisitorId(req) {
    const existing = req.cookies?.[COOKIE_NAME];
    if (typeof existing === 'string' && VISITOR_ID_PATTERN.test(existing)) {
        return { id: existing, isNew: false };
    }
    return { id: randomUUID(), isNew: true };
}

export const trackVisitor = async (req, res) => {
    const { id, isNew } = resolveVisitorId(req);

    if (isNew) {
        res.cookie(COOKIE_NAME, id, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 365 * 2,
            path: '/'
        });
    }

    try {
        const stats = await trackAndGetVisitorStats(id);
        return res.json(stats);
    } catch {
        return res.status(500).json({ message: 'Failed to track visitor stats' });
    }
};

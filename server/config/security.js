const DEV_CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, '');

const parseCorsOrigins = () => {
    const raw = process.env.CORS_ORIGINS ?? '';
    const parsed = raw
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
        .map(normalizeOrigin);

    if (parsed.length > 0) {
        return new Set(parsed);
    }

    if (process.env.NODE_ENV === 'production') {
        return new Set();
    }

    return new Set(DEV_CORS_ORIGINS);
};

const allowedCorsOrigins = parseCorsOrigins();

const getForwardedValue = (value) => value.split(',')[0]?.trim();

const isSameOrigin = (requestOrigin, req) => {
    try {
        const parsedOrigin = new URL(requestOrigin);
        const requestHost = getForwardedValue(req.get('x-forwarded-host') || req.get('host') || '');
        const requestProto = getForwardedValue(req.get('x-forwarded-proto') || req.protocol || 'http');

        if (!requestHost) {
            return false;
        }

        return (
            parsedOrigin.host === requestHost
            && parsedOrigin.protocol === `${requestProto}:`
        );
    } catch {
        return false;
    }
};

export const resolveCorsOptions = (req) => {
    const requestOrigin = req.get('origin');

    if (!requestOrigin) {
        return { origin: true, credentials: true };
    }

    const normalizedOrigin = normalizeOrigin(requestOrigin);
    const isAllowed = (
        allowedCorsOrigins.has(normalizedOrigin)
        || isSameOrigin(normalizedOrigin, req)
    );

    return {
        origin: isAllowed,
        credentials: true
    };
};

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: JWT_SECRET environment variable is not defined!');
        process.exit(1);
    } else {
        console.warn('WARNING: JWT_SECRET is not defined. Using a temporary secret for development.');
    }
}

const EFFECTIVE_SECRET = JWT_SECRET || 'dev-only-secret-do-not-use-in-production';

export function authenticateToken(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    jwt.verify(token, EFFECTIVE_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: '토큰이 유효하지 않습니다.' });
        }
        req.user = user;
        next();
    });
}

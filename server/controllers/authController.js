import jwt from 'jsonwebtoken';
import { ADMIN_PASSWORD, JWT_SECRET } from '../config/auth.js';

const AUTH_COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;
const VALID_SAME_SITE = new Set(['strict', 'lax', 'none']);

const normalizeSameSite = (value) => {
    const normalized = String(value ?? '').trim().toLowerCase();
    return VALID_SAME_SITE.has(normalized) ? normalized : '';
};

const resolveCookieSameSite = () => {
    const configured = normalizeSameSite(process.env.COOKIE_SAME_SITE);
    if (configured) {
        return configured;
    }

    return process.env.CORS_ORIGINS?.trim() ? 'none' : 'lax';
};

const resolveCookieSecure = (sameSite) => {
    const configured = String(process.env.COOKIE_SECURE ?? '').trim().toLowerCase();

    if (configured === 'true') {
        return true;
    }

    if (configured === 'false') {
        return false;
    }

    return process.env.NODE_ENV === 'production' || sameSite === 'none';
};

const buildAuthCookieOptions = () => {
    const sameSite = resolveCookieSameSite();

    return {
        httpOnly: true,
        secure: resolveCookieSecure(sameSite),
        sameSite,
        path: '/',
        maxAge: AUTH_COOKIE_MAX_AGE
    };
};

const buildAuthClearCookieOptions = () => {
    const { httpOnly, secure, sameSite, path } = buildAuthCookieOptions();
    return { httpOnly, secure, sameSite, path };
};

export const login = (req, res) => {
    const { password } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: '비밀번호가 올바르지 않습니다.' });
    }

    // Role is simple: 'admin'
    const user = { role: 'admin' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    const cookieOptions = buildAuthCookieOptions();

    res.cookie('token', token, cookieOptions);

    res.json({ message: '로그인 성공', user });
};

export const logout = (req, res) => {
    res.clearCookie('token', buildAuthClearCookieOptions());
    res.json({ message: '로그아웃 성공' });
};

export const me = (req, res) => {
    // If request reached here, middleware passed, so user is authenticated
    res.json({ user: req.user });
};

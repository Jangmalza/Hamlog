import jwt from 'jsonwebtoken';
import { ADMIN_PASSWORD, JWT_SECRET } from '../config/auth.js';

export const login = (req, res) => {
    const { password } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: '비밀번호가 올바르지 않습니다.' });
    }

    // Role is simple: 'admin'
    const user = { role: 'admin' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true if https
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ message: '로그인 성공', user });
};

export const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: '로그아웃 성공' });
};

export const me = (req, res) => {
    // If request reached here, middleware passed, so user is authenticated
    res.json({ user: req.user });
};

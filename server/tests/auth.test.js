import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';

test('POST /api/auth/login should reject invalid password', async () => {
    const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'not-valid-password' });

    assert.equal(response.status, 401);
    assert.equal(response.body.message, '비밀번호가 올바르지 않습니다.');
});

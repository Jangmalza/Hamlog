import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';

test('GET /api/preview should require url query', async () => {
    const response = await request(app).get('/api/preview');

    assert.equal(response.status, 400);
    assert.equal(response.body.error, 'URL is required');
});

import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { access, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import request from 'supertest';

import app from '../app.js';
import { dataDir, postsDir, postsFilePath, uploadDir } from '../config/paths.js';
import { readCategories, writeCategories } from '../models/categoryModel.js';
import { readComments, writeComments } from '../models/commentModel.js';
import { ensurePostsFile, readPosts, writePosts } from '../models/postModel.js';
import { readProfile, writeProfile } from '../models/profileModel.js';
import { readPostRevisions } from '../models/revisionModel.js';
import { defaultProfile } from '../utils/normalizers.js';

const adminPassword = process.env.ADMIN_PASSWORD ?? 'test-password';
const tinyPngDataUrl =
    'data:image/png;base64,'
    + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0mQAAAAASUVORK5CYII=';
const sampleContentJson = {
    type: 'doc',
    content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Heading' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Body copy' }] }
    ]
};
const parsedHtmlContentJson = {
    type: 'doc',
    content: [
        {
            type: 'heading',
            attrs: { level: 1, textAlign: null },
            content: [{ type: 'text', text: 'Heading' }]
        },
        {
            type: 'paragraph',
            attrs: { textAlign: null },
            content: [{ type: 'text', text: 'Body copy' }]
        }
    ]
};

let backupRoot = '';

const copyIfExists = async (sourcePath, destinationPath) => {
    try {
        await cp(sourcePath, destinationPath, { recursive: true, force: true });
    } catch (error) {
        if (error && error.code !== 'ENOENT') {
            throw error;
        }
    }
};

const resetTestState = async () => {
    await rm(dataDir, { recursive: true, force: true });
    await rm(uploadDir, { recursive: true, force: true });

    await mkdir(dataDir, { recursive: true });
    await mkdir(uploadDir, { recursive: true });

    await writePosts([]);
    await writeCategories([]);
    await writeProfile(defaultProfile);
    await writeComments([]);
};

const loginAsAdmin = async () => {
    const response = await request(app)
        .post('/api/auth/login')
        .send({ password: adminPassword });

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.headers['set-cookie']));

    return response.headers['set-cookie'];
};

before(async () => {
    backupRoot = await mkdtemp(path.join(tmpdir(), 'hamlog-tests-'));
    await copyIfExists(dataDir, path.join(backupRoot, 'data'));
    await copyIfExists(uploadDir, path.join(backupRoot, 'uploads'));
    await resetTestState();
});

beforeEach(async () => {
    await resetTestState();
});

after(async () => {
    await rm(dataDir, { recursive: true, force: true });
    await rm(uploadDir, { recursive: true, force: true });

    await copyIfExists(path.join(backupRoot, 'data'), dataDir);
    await copyIfExists(path.join(backupRoot, 'uploads'), uploadDir);

    if (backupRoot) {
        await rm(backupRoot, { recursive: true, force: true });
    }
});

test('authenticated content routes persist posts and categories', async () => {
    const unauthenticatedCreate = await request(app)
        .post('/api/posts')
        .send({
            slug: 'unauthorized-post',
            title: 'Unauthorized Post',
            summary: 'summary',
            category: 'DevOps',
            contentHtml: '<p>blocked</p>',
            publishedAt: '2026-03-06',
            readingTime: '1분 읽기',
            tags: [],
            status: 'published',
            sections: []
        });

    assert.equal(unauthenticatedCreate.status, 401);

    const cookies = await loginAsAdmin();

    const createCategoryResponse = await request(app)
        .post('/api/categories')
        .set('Cookie', cookies)
        .send({ name: 'DevOps' });

    assert.equal(createCategoryResponse.status, 201);

    const createdCategory = createCategoryResponse.body.categories.find(
        category => category.name === 'DevOps'
    );
    assert.ok(createdCategory);

    const createPostPayload = {
        slug: 'ci-hardening',
        title: 'CI Hardening',
        summary: 'pipeline hardening summary',
        category: 'DevOps',
        contentJson: sampleContentJson,
        contentHtml: '<p>stale html should not be stored</p>',
        publishedAt: '2026-03-06',
        readingTime: '2분 읽기',
        tags: ['ci', 'deploy'],
        status: 'published',
        sections: []
    };

    const createPostResponse = await request(app)
        .post('/api/posts')
        .set('Cookie', cookies)
        .send(createPostPayload);

    assert.equal(createPostResponse.status, 201);
    assert.equal(createPostResponse.body.slug, createPostPayload.slug);
    assert.deepEqual(createPostResponse.body.contentJson, sampleContentJson);
    assert.equal(createPostResponse.body.contentHtml, '<h1>Heading</h1><p>Body copy</p>');

    const updateCategoryResponse = await request(app)
        .patch(`/api/categories/${encodeURIComponent(createdCategory.id)}`)
        .set('Cookie', cookies)
        .send({ name: 'Platform' });

    assert.equal(updateCategoryResponse.status, 200);

    const postsAfterCategoryRename = await readPosts();
    assert.equal(postsAfterCategoryRename.length, 1);
    assert.equal(postsAfterCategoryRename[0].category, 'Platform');
    assert.deepEqual(postsAfterCategoryRename[0].contentJson, sampleContentJson);
    assert.equal(postsAfterCategoryRename[0].contentHtml, '<h1>Heading</h1><p>Body copy</p>');

    const updatePostResponse = await request(app)
        .put(`/api/posts/${createPostResponse.body.id}`)
        .set('Cookie', cookies)
        .send({
            ...createPostPayload,
            slug: 'ci-hardening-updated',
            title: 'CI Hardening Updated',
            category: 'Platform'
        });

    assert.equal(updatePostResponse.status, 200);
    assert.equal(updatePostResponse.body.slug, 'ci-hardening-updated');

    const revisionsAfterUpdate = await readPostRevisions(createPostResponse.body.id);
    assert.ok(revisionsAfterUpdate.length >= 2);
    assert.equal(revisionsAfterUpdate[0].event, 'updated');

    const deleteCategoryResponse = await request(app)
        .delete(`/api/categories/${encodeURIComponent(createdCategory.id)}`)
        .set('Cookie', cookies);

    assert.equal(deleteCategoryResponse.status, 200);

    const postsAfterCategoryDelete = await readPosts();
    assert.equal(postsAfterCategoryDelete.length, 1);
    assert.equal(postsAfterCategoryDelete[0].category, '미분류');

    const categoriesAfterDelete = await readCategories();
    assert.ok(!categoriesAfterDelete.some(category => category.name === 'Platform'));

    const deletePostResponse = await request(app)
        .delete(`/api/posts/${createPostResponse.body.id}`)
        .set('Cookie', cookies);

    assert.equal(deletePostResponse.status, 204);

    const postsAfterDelete = await readPosts();
    assert.equal(postsAfterDelete.length, 0);
    assert.deepEqual(await readPostRevisions(createPostResponse.body.id), []);
});

test('ensurePostsFile backfills contentJson for legacy html-only posts', async () => {
    await rm(postsDir, { recursive: true, force: true });

    const legacyPost = {
        id: 'legacy-post-1',
        slug: 'legacy-html-post',
        title: 'Legacy HTML Post',
        summary: 'legacy summary',
        category: 'Legacy',
        contentHtml: '<h1>Heading</h1><p>Body copy</p>',
        publishedAt: '2026-03-06',
        readingTime: '2분 읽기',
        tags: [],
        status: 'published',
        sections: []
    };

    await writeFile(postsFilePath, JSON.stringify([legacyPost], null, 2), 'utf8');

    await ensurePostsFile();

    const posts = await readPosts();
    assert.equal(posts.length, 1);
    assert.deepEqual(posts[0].contentJson, parsedHtmlContentJson);
    assert.equal(posts[0].contentHtml, '<h1>Heading</h1><p>Body copy</p>');

    const postFilePath = path.join(postsDir, 'legacy-html-post.json');
    const storedPost = JSON.parse(await readFile(postFilePath, 'utf8'));
    assert.deepEqual(storedPost.contentJson, parsedHtmlContentJson);
});

test('post revisions can be listed and restored', async () => {
    const cookies = await loginAsAdmin();

    const createPostResponse = await request(app)
        .post('/api/posts')
        .set('Cookie', cookies)
        .send({
            slug: 'revision-driven-post',
            title: 'Revision Driven Post',
            summary: 'revision summary',
            category: 'Engineering',
            contentJson: sampleContentJson,
            publishedAt: '2026-03-06',
            readingTime: '2분 읽기',
            tags: ['editor'],
            status: 'published',
            sections: []
        });

    assert.equal(createPostResponse.status, 201);

    const createdPostId = createPostResponse.body.id;

    const initialRevisionsResponse = await request(app)
        .get(`/api/posts/${createdPostId}/revisions`)
        .set('Cookie', cookies);

    assert.equal(initialRevisionsResponse.status, 200);
    assert.equal(initialRevisionsResponse.body.length, 1);
    assert.equal(initialRevisionsResponse.body[0].event, 'created');
    assert.equal(initialRevisionsResponse.body[0].title, 'Revision Driven Post');

    const updatePostResponse = await request(app)
        .put(`/api/posts/${createdPostId}`)
        .set('Cookie', cookies)
        .send({
            ...createPostResponse.body,
            title: 'Revision Driven Post Updated',
            slug: 'revision-driven-post-updated',
            category: 'Engineering'
        });

    assert.equal(updatePostResponse.status, 200);

    const updatedRevisionsResponse = await request(app)
        .get(`/api/posts/${createdPostId}/revisions`)
        .set('Cookie', cookies);

    assert.equal(updatedRevisionsResponse.status, 200);
    assert.equal(updatedRevisionsResponse.body[0].event, 'updated');
    assert.ok(updatedRevisionsResponse.body.some(revision => revision.event === 'created'));

    const createdRevision = updatedRevisionsResponse.body.find(
        revision => revision.event === 'created'
    );
    assert.ok(createdRevision);

    const restoreResponse = await request(app)
        .post(`/api/posts/${createdPostId}/revisions/${createdRevision.id}/restore`)
        .set('Cookie', cookies);

    assert.equal(restoreResponse.status, 200);
    assert.equal(restoreResponse.body.title, 'Revision Driven Post');
    assert.equal(restoreResponse.body.slug, 'revision-driven-post');

    const restoredRevisionsResponse = await request(app)
        .get(`/api/posts/${createdPostId}/revisions`)
        .set('Cookie', cookies);

    assert.equal(restoredRevisionsResponse.status, 200);
    assert.equal(restoredRevisionsResponse.body[0].event, 'restored');
    assert.ok(restoredRevisionsResponse.body.some(revision => revision.event === 'updated'));
});

test('profile update and uploads require authentication and persist', async () => {
    const unauthenticatedProfileUpdate = await request(app)
        .put('/api/profile')
        .send({ title: 'Should not persist' });

    assert.equal(unauthenticatedProfileUpdate.status, 401);

    const unauthenticatedUpload = await request(app)
        .post('/api/uploads')
        .send({ dataUrl: tinyPngDataUrl });

    assert.equal(unauthenticatedUpload.status, 401);

    const cookies = await loginAsAdmin();

    const updateProfileResponse = await request(app)
        .put('/api/profile')
        .set('Cookie', cookies)
        .send({
            title: 'HamLog Ops',
            name: 'Hamwoo',
            role: 'Engineer',
            description: 'Operational profile ready for deployment checks.'
        });

    assert.equal(updateProfileResponse.status, 200);

    const savedProfile = await readProfile();
    assert.equal(savedProfile.title, 'HamLog Ops');
    assert.equal(savedProfile.description, 'Operational profile ready for deployment checks.');

    const uploadResponse = await request(app)
        .post('/api/uploads')
        .set('Cookie', cookies)
        .send({ dataUrl: tinyPngDataUrl });

    assert.equal(uploadResponse.status, 201);
    assert.match(uploadResponse.body.url, /^\/uploads\/upload-.*\.webp$/);

    await access(path.join(uploadDir, uploadResponse.body.filename));
});

test('comments respect password verification on deletion', async () => {
    await writePosts([
        {
            id: 'post-1',
            slug: 'verified-comment-post',
            title: 'Verified Comment Post',
            summary: 'comment target',
            category: 'Testing',
            contentHtml: '<p>Hello comments</p>',
            publishedAt: '2026-03-06',
            readingTime: '1분 읽기',
            tags: [],
            status: 'published',
            sections: []
        }
    ]);

    const createCommentResponse = await request(app)
        .post('/api/comments')
        .send({
            postId: 'post-1',
            author: 'Reader',
            password: 'secret-password',
            content: 'Nice post'
        });

    assert.equal(createCommentResponse.status, 201);
    assert.equal(createCommentResponse.body.comment.author, 'Reader');
    assert.ok(!('password' in createCommentResponse.body.comment));

    const listCommentsResponse = await request(app).get('/api/comments?postId=post-1');
    assert.equal(listCommentsResponse.status, 200);
    assert.equal(listCommentsResponse.body.comments.length, 1);

    const storedComments = await readComments();
    assert.equal(storedComments.length, 1);
    assert.notEqual(storedComments[0].password, 'secret-password');

    const failedDeleteResponse = await request(app)
        .delete(`/api/comments/${createCommentResponse.body.comment.id}`)
        .send({ password: 'wrong-password' });

    assert.equal(failedDeleteResponse.status, 403);

    const successfulDeleteResponse = await request(app)
        .delete(`/api/comments/${createCommentResponse.body.comment.id}`)
        .send({ password: 'secret-password' });

    assert.equal(successfulDeleteResponse.status, 200);

    const remainingComments = await readComments();
    assert.equal(remainingComments.length, 0);
});

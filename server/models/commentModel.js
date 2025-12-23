import { readFile, writeFile, access, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');
const commentsFilePath = path.join(dataDir, 'comments.json');

export async function ensureCommentsFile() {
    await mkdir(dataDir, { recursive: true });
    try {
        await access(commentsFilePath);
    } catch {
        await writeFile(commentsFilePath, JSON.stringify([], null, 2), 'utf8');
    }
}

export async function readComments() {
    try {
        const raw = await readFile(commentsFilePath, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await ensureCommentsFile();
            return [];
        }
        throw error;
    }
}

export async function writeComments(comments) {
    await writeFile(commentsFilePath, JSON.stringify(comments, null, 2), 'utf8');
}

export async function getCommentsByPostId(postId) {
    const all = await readComments();
    return all
        .filter(c => c.postId === postId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createComment(data) {
    const all = await readComments();
    const newComment = {
        id: randomUUID(),
        postId: data.postId,
        author: data.author || 'Anonymous',
        password: data.password, // Plain text for simplicity as per plan, or simple hash if strict? Plan said simple equality check.
        content: data.content,
        createdAt: new Date().toISOString()
    };
    await writeComments([...all, newComment]);
    return newComment;
}

export async function deleteComment(id, password) {
    const all = await readComments();
    const target = all.find(c => c.id === id);

    if (!target) return { success: false, reason: 'not_found' };
    if (target.password !== password) return { success: false, reason: 'wrong_password' };

    const next = all.filter(c => c.id !== id);
    await writeComments(next);
    return { success: true };
}

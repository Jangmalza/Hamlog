import { randomUUID } from 'crypto';
import { mkdir, readFile, rm } from 'fs/promises';
import path from 'path';
import { dataDir, revisionsDir } from '../config/paths.js';
import { writeJsonAtomic } from '../utils/fsUtils.js';

const MAX_REVISIONS_PER_POST = 25;
const VALID_REVISION_EVENTS = new Set(['baseline', 'created', 'updated', 'restored']);

const cloneJson = (value) => JSON.parse(JSON.stringify(value));

const getRevisionFilePath = (postId) => path.join(revisionsDir, `${postId}.json`);

const normalizeRevisionEvent = (event) => (
    VALID_REVISION_EVENTS.has(event) ? event : 'updated'
);

const normalizeRevision = (revision) => {
    if (!revision || typeof revision !== 'object') return revision;

    const snapshot = revision.snapshot && typeof revision.snapshot === 'object'
        ? cloneJson(revision.snapshot)
        : null;

    return {
        id: typeof revision.id === 'string' && revision.id
            ? revision.id
            : `revision-${randomUUID()}`,
        postId: typeof revision.postId === 'string' && revision.postId
            ? revision.postId
            : snapshot?.id || '',
        savedAt: typeof revision.savedAt === 'string' && revision.savedAt
            ? revision.savedAt
            : new Date().toISOString(),
        event: normalizeRevisionEvent(revision.event),
        title: typeof revision.title === 'string' ? revision.title : snapshot?.title || '',
        slug: typeof revision.slug === 'string' ? revision.slug : snapshot?.slug || '',
        status: snapshot?.status ?? revision.status ?? 'draft',
        snapshot
    };
};

export function buildPostRevision(post, event = 'updated') {
    return normalizeRevision({
        id: `revision-${randomUUID()}`,
        postId: post.id,
        savedAt: new Date().toISOString(),
        event,
        title: post.title,
        slug: post.slug,
        status: post.status,
        snapshot: cloneJson(post)
    });
}

export async function ensureRevisionsStorage() {
    await mkdir(dataDir, { recursive: true });
    await mkdir(revisionsDir, { recursive: true });
}

export async function readPostRevisions(postId) {
    try {
        const raw = await readFile(getRevisionFilePath(postId), 'utf8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(normalizeRevision);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}

export async function writePostRevisions(postId, revisions) {
    await ensureRevisionsStorage();
    const normalized = revisions
        .map(normalizeRevision)
        .slice(0, MAX_REVISIONS_PER_POST);
    await writeJsonAtomic(getRevisionFilePath(postId), normalized);
}

export async function createPostRevision(post, event = 'updated') {
    const revision = buildPostRevision(post, event);
    const revisions = await readPostRevisions(post.id);
    await writePostRevisions(post.id, [revision, ...revisions]);
    return revision;
}

export async function deletePostRevisions(postId) {
    await rm(getRevisionFilePath(postId), { force: true });
}

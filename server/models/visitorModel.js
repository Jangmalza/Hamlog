import { readFile, mkdir } from 'fs/promises';
import { dataDir, visitorsFilePath } from '../config/paths.js';
import { writeJsonAtomic } from '../utils/fsUtils.js';

const defaultVisitorData = {
    totalVisitors: 0,
    dailyVisitors: {},
    seenVisitorIds: [],
    dailySeenVisitorIds: {}
};

function normalizeVisitorData(input) {
    if (!input || typeof input !== 'object') {
        return { ...defaultVisitorData };
    }

    const totalVisitors = Number.isFinite(input.totalVisitors) && input.totalVisitors >= 0
        ? Math.floor(input.totalVisitors)
        : 0;

    const dailyVisitors = {};
    if (input.dailyVisitors && typeof input.dailyVisitors === 'object') {
        Object.entries(input.dailyVisitors).forEach(([key, value]) => {
            if (typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(value) && value >= 0) {
                dailyVisitors[key] = Math.floor(value);
            }
        });
    }

    const seenVisitorIds = Array.isArray(input.seenVisitorIds)
        ? input.seenVisitorIds.filter(id => typeof id === 'string' && id.length > 0)
        : [];

    const dailySeenVisitorIds = {};
    if (input.dailySeenVisitorIds && typeof input.dailySeenVisitorIds === 'object') {
        Object.entries(input.dailySeenVisitorIds).forEach(([dateKey, ids]) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !Array.isArray(ids)) return;
            dailySeenVisitorIds[dateKey] = ids.filter(id => typeof id === 'string' && id.length > 0);
        });
    }

    return {
        totalVisitors,
        dailyVisitors,
        seenVisitorIds,
        dailySeenVisitorIds
    };
}

export async function readVisitorData() {
    try {
        const raw = await readFile(visitorsFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        return normalizeVisitorData(parsed);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return await writeVisitorData(defaultVisitorData);
        }
        throw error;
    }
}

export async function writeVisitorData(data) {
    const normalized = normalizeVisitorData(data);
    await writeJsonAtomic(visitorsFilePath, normalized);
    return normalized;
}

export async function ensureVisitorFile() {
    await mkdir(dataDir, { recursive: true });
    try {
        await import('fs/promises').then(fs => fs.access(visitorsFilePath));
        const existing = await readVisitorData();
        await writeVisitorData(existing);
    } catch {
        await writeVisitorData(defaultVisitorData);
    }
}

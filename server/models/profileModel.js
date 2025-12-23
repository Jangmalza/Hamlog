import { readFile, writeFile, mkdir } from 'fs/promises';
import { profileFilePath, dataDir } from '../config/paths.js';
import {
    normalizeProfile,
    defaultProfile
} from '../utils/normalizers.js';

export async function readProfile() {
    try {
        const raw = await readFile(profileFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        return normalizeProfile(parsed);
    } catch (error) {
        if (error && error.code === 'ENOENT') {
            return await writeProfile(defaultProfile);
        }
        throw error;
    }
}

export async function writeProfile(profile) {
    const normalized = normalizeProfile(profile);
    await writeFile(profileFilePath, JSON.stringify(normalized, null, 2), 'utf8');
    return normalized;
}

export async function ensureProfileFile() {
    await mkdir(dataDir, { recursive: true });
    try {
        await import('fs/promises').then(fs => fs.access(profileFilePath));
        const existing = await readProfile();
        await writeProfile(existing);
    } catch {
        await writeProfile(defaultProfile);
    }
}

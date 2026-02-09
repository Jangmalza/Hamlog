import { writeFile, rename } from 'fs/promises';
import { randomBytes } from 'crypto';

/**
 * Writes content to a file atomically by writing to a temporary file first
 * and then renaming it.
 * 
 * @param {string} filePath - The target file path
 * @param {string|Buffer} content - The content to write
 * @param {string} [encoding='utf8'] - File encoding
 */
export async function writeJsonAtomic(filePath, data) {
    const content = JSON.stringify(data, null, 2);
    const tempPath = `${filePath}.${randomBytes(4).toString('hex')}.tmp`;

    try {
        await writeFile(tempPath, content, 'utf8');
        await rename(tempPath, filePath);
    } catch (error) {
        // Cleanup temp file if it was created and rename failed
        try {
            const { unlink } = await import('fs/promises');
            await unlink(tempPath);
        } catch {
            // Ignore unlink errors
        }
        throw error;
    }
}

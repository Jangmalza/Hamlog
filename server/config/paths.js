import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolves to server/ directory since we are in server/config/
const serverDir = path.resolve(__dirname, '..');

export const dataDir = path.join(serverDir, 'data');
export const postsFilePath = path.join(dataDir, 'posts.json');
export const categoriesFilePath = path.join(dataDir, 'categories.json');
export const profileFilePath = path.join(dataDir, 'profile.json');
export const uploadDir = path.join(serverDir, 'uploads');

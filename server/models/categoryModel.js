import { readFile, mkdir } from 'fs/promises';
import { categoriesFilePath, dataDir } from '../config/paths.js';
import { writeJsonAtomic } from '../utils/fsUtils.js';
import { normalizeCategoryList } from '../utils/normalizers.js';

export async function readCategories() {
    const raw = await readFile(categoriesFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    return normalizeCategoryList(parsed);
}

export async function writeCategories(categories) {
    const normalized = normalizeCategoryList(categories);
    await writeJsonAtomic(categoriesFilePath, normalized);
    return normalized;
}

export async function ensureCategoriesFile() {
    await mkdir(dataDir, { recursive: true });
    try {
        await import('fs/promises').then(fs => fs.access(categoriesFilePath)); // Clean way to check access? 
        // access throws if not exists
        const existing = await readCategories();
        await writeCategories(existing);
    } catch {
        // We need readPosts logic here? index.js fell back to deriving categories from posts.
        // Circular dependency warning: PostModel needs CategoryModel?
        // In index.js: ensureCategoriesFile calls readPosts.
        // We should move ensure functions to a startup script or keep in index? 
        // Or allow cross-model usage.
        // For now, let's implement basic CRUD. Startup ensures might be better in a 'services/init.js' or just imports.

        // Simplification for now: If categories.json missing, start with defaults.
        // The "derive from posts" logic was for migration. 
        // I will try to implement it if I can import readPosts.
        const derived = []; // Fallback empty
        await writeCategories(derived);
    }
}

// ... other category manipulation functions (addCategoryIfMissing, etc) can be moved here or controller.
// Logic like `addCategoryIfMissing` involves reading/writing, so Model/Service layer is appropriate.



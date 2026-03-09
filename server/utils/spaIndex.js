import { access, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPA_INDEX_CANDIDATES = [
  path.join(__dirname, '../../dist/index.html'),
  path.join(__dirname, '../../index.html')
];

let cachedSpaIndexPath = null;

export async function resolveSpaIndexPath() {
  if (cachedSpaIndexPath) {
    return cachedSpaIndexPath;
  }

  for (const candidate of SPA_INDEX_CANDIDATES) {
    try {
      await access(candidate);
      cachedSpaIndexPath = candidate;
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error('SPA index template not found.');
}

export async function readSpaIndexHtml() {
  const indexPath = await resolveSpaIndexPath();
  return readFile(indexPath, 'utf8');
}

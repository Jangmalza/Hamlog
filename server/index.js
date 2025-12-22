import express from 'express';
import cors from 'cors';
import { access, mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { createCategoryRouter } from './routes/categories.js';
import { createPostRouter } from './routes/posts.js';
import { createProfileRouter } from './routes/profile.js';
import { createUploadRouter } from './routes/uploads.js';
import { createHealthRouter } from './routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const postsFilePath = path.join(dataDir, 'posts.json');
const categoriesFilePath = path.join(dataDir, 'categories.json');
const profileFilePath = path.join(dataDir, 'profile.json');
const uploadDir = path.join(__dirname, 'uploads');

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use('/uploads', express.static(uploadDir));

app.get('/rss.xml', async (req, res) => {
  try {
    const posts = await readPosts();
    const profile = await readProfile();
    const publishedPosts = posts
      .filter(p => p.status === 'published')
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const baseUrl = 'https://hamlog.dev'; // Ask user or use placeholder? I'll use a placeholder or check config.
    // Ideally should be configurable. I'll use localhost for dev/placeholder for now or use Host header.
    // Better to use a variable. I'll define it.

    // Simplest RSS 2.0
    const items = publishedPosts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/posts/${post.slug}</link>
      <guid>${baseUrl}/posts/${post.slug}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${post.summary}]]></description>
      ${post.category ? `<category>${post.category}</category>` : ''}
    </item>`).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${profile.title}</title>
    <link>${baseUrl}</link>
    <description>${profile.tagline}</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

    res.set('Content-Type', 'text/xml');
    res.send(rss);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating RSS');
  }
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const posts = await readPosts();
    const publishedPosts = posts.filter(p => p.status === 'published');
    const baseUrl = 'https://hamlog.dev';

    const urls = publishedPosts.map(post => `
  <url>
    <loc>${baseUrl}/posts/${post.slug}</loc>
    <lastmod>${post.publishedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${urls}
</urlset>`;

    res.set('Content-Type', 'text/xml');
    res.send(sitemap);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating Sitemap');
  }
});

const allowedSectionTypes = new Set([
  'heading',
  'paragraph',
  'list',
  'code',
  'quote',
  'callout',
  'image'
]);
const allowedPostStatuses = new Set(['draft', 'scheduled', 'published']);
const DEFAULT_CATEGORY = '미분류';
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const allowedImageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif']
]);

const defaultProfile = {
  title: 'Hamlog',
  name: 'Hamwoo',
  role: '프론트엔드 엔지니어',
  tagline: '탄탄한 UI와 제품 경험을 만들어가는 기록.',
  description:
    '프론트엔드 아키텍처, 사용자 경험, 실용적인 도구 선택에 대한 짧고 명확한 노트를 남깁니다.',
  location: '서울',
  profileImage: '/avatar.jpg',
  email: 'hello@hamlog.dev',
  social: {
    github: 'https://github.com/Jangmalza',
    instagram: 'https://www.instagram.com/hamwo_o/'
  },
  stack: ['React', 'TypeScript', 'Vite', 'Node.js', 'Tailwind'],
  now: '로컬 퍼스트 글쓰기 워크플로우와 작은 퍼블리싱 파이프라인을 다듬는 중입니다.'
};

async function ensurePostsFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await access(postsFilePath);
    const existing = await readPosts();
    if (isLegacySeed(existing)) {
      await writePosts(seedPosts());
    }
  } catch {
    await writePosts(seedPosts());
  }
}

async function ensureUploadDir() {
  await mkdir(uploadDir, { recursive: true });
}

async function ensureCategoriesFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await access(categoriesFilePath);
    const existing = await readCategories();
    await writeCategories(existing);
  } catch {
    const posts = await readPosts();
    const derived = normalizeCategoryList(posts.map(post => post.category));
    await writeCategories(derived);
  }
}

async function ensureProfileFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await access(profileFilePath);
    const existing = await readProfile();
    await writeProfile(existing);
  } catch {
    await writeProfile(defaultProfile);
  }
}

async function readPosts() {
  const raw = await readFile(postsFilePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((post) => {
    if (!post || typeof post !== 'object') return post;
    return {
      ...post,
      category: normalizeCategory(post.category),
      status: normalizePostStatus(post.status),
      scheduledAt: normalizeScheduledAt(post.scheduledAt) || undefined,
      seo: normalizeSeo(post.seo)
    };
  });
}

async function writePosts(posts) {
  await writeFile(postsFilePath, JSON.stringify(posts, null, 2), 'utf8');
}

async function readCategories() {
  const raw = await readFile(categoriesFilePath, 'utf8');
  const parsed = JSON.parse(raw);
  return normalizeCategoryList(parsed);
}

async function writeCategories(categories) {
  const normalized = normalizeCategoryList(categories);
  await writeFile(categoriesFilePath, JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}

async function readProfile() {
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

async function writeProfile(profile) {
  const normalized = normalizeProfile(profile);
  await writeFile(profileFilePath, JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.map(tag => String(tag).trim()).filter(Boolean);
}

function normalizeCategoryName(value) {
  return value !== undefined && value !== null ? String(value).trim() : '';
}

function normalizeCategory(category) {
  const normalized = normalizeCategoryName(category);
  return normalized || DEFAULT_CATEGORY;
}

function normalizeCategoryId(value) {
  const normalized = normalizeCategoryName(value);
  return normalized || '';
}

function normalizeCategoryOrder(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0) return null;
  return Math.floor(parsed);
}

function normalizePostStatus(status) {
  const normalized = status ? String(status).toLowerCase().trim() : '';
  if (allowedPostStatuses.has(normalized)) return normalized;
  return 'published';
}

function normalizeScheduledAt(value) {
  if (!value) return '';
  const timestamp = new Date(String(value)).getTime();
  if (Number.isNaN(timestamp)) return '';
  return new Date(timestamp).toISOString();
}

function normalizeSeo(seo) {
  if (!seo || typeof seo !== 'object') return undefined;
  const result = {};
  if (seo.title !== undefined) {
    const title = String(seo.title).trim();
    if (title) result.title = title;
  }
  if (seo.description !== undefined) {
    const description = String(seo.description).trim();
    if (description) result.description = description;
  }
  if (seo.ogImage !== undefined) {
    const ogImage = String(seo.ogImage).trim();
    if (ogImage) result.ogImage = ogImage;
  }
  if (seo.canonicalUrl !== undefined) {
    const canonicalUrl = String(seo.canonicalUrl).trim();
    if (canonicalUrl) result.canonicalUrl = canonicalUrl;
  }
  if (seo.keywords !== undefined) {
    const keywords = Array.isArray(seo.keywords)
      ? seo.keywords
      : String(seo.keywords).split(',');
    const normalized = keywords
      .map(item => String(item).trim())
      .filter(Boolean);
    if (normalized.length > 0) {
      result.keywords = normalized;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeRequiredString(value, fallback) {
  const normalized = value !== undefined && value !== null ? String(value).trim() : '';
  return normalized || fallback;
}

function normalizeOptionalString(value, fallback) {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function normalizeCategoryKey(category) {
  return normalizeCategory(category).toLowerCase();
}

function normalizeCategoryList(categories) {
  const list = Array.isArray(categories) ? categories : [];
  const categoryMap = new Map();
  const idMap = new Map();
  const normalizedList = [];
  const sourceIndexById = new Map();

  list.forEach((item) => {
    if (typeof item === 'string') {
      const name = normalizeCategoryName(item);
      if (!name) return;
      const key = normalizeCategoryKey(name);
      if (categoryMap.has(key)) return;
      let id = randomUUID();
      if (idMap.has(id)) {
        id = randomUUID();
      }
      const next = { id, name, parentId: null, order: null };
      categoryMap.set(key, next);
      idMap.set(id, next);
      normalizedList.push(next);
      sourceIndexById.set(id, normalizedList.length - 1);
      return;
    }
    if (!item || typeof item !== 'object') return;
    const name = normalizeCategoryName(item.name);
    if (!name) return;
    const key = normalizeCategoryKey(name);
    if (categoryMap.has(key)) return;
    let id = normalizeCategoryId(item.id);
    if (!id || idMap.has(id)) {
      id = randomUUID();
    }
    const parentId = normalizeCategoryId(item.parentId);
    const order = normalizeCategoryOrder(item.order);
    const next = { id, name, parentId: parentId || null, order };
    categoryMap.set(key, next);
    idMap.set(id, next);
    normalizedList.push(next);
    sourceIndexById.set(id, normalizedList.length - 1);
  });

  const defaultKey = normalizeCategoryKey(DEFAULT_CATEGORY);
  if (!categoryMap.has(defaultKey)) {
    const id = randomUUID();
    const next = { id, name: DEFAULT_CATEGORY, parentId: null, order: null };
    categoryMap.set(defaultKey, next);
    idMap.set(id, next);
    normalizedList.push(next);
    sourceIndexById.set(id, normalizedList.length - 1);
  }

  const defaultEntry = categoryMap.get(defaultKey);
  normalizedList.forEach((item) => {
    const parentId = normalizeCategoryId(item.parentId);
    if (!parentId || parentId === item.id || !idMap.has(parentId)) {
      item.parentId = null;
      return;
    }
    if (defaultEntry && parentId === defaultEntry.id) {
      item.parentId = null;
      return;
    }
    let cursor = parentId;
    const visited = new Set([item.id]);
    while (cursor) {
      if (visited.has(cursor)) {
        item.parentId = null;
        return;
      }
      visited.add(cursor);
      const parent = idMap.get(cursor);
      cursor = parent?.parentId ? String(parent.parentId) : '';
    }
    item.parentId = parentId;
  });

  const groups = new Map();
  normalizedList.forEach((item) => {
    const key = item.parentId ?? '__root__';
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  });

  groups.forEach((items) => {
    const sorted = [...items].sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : Number.POSITIVE_INFINITY;
      const orderB = Number.isFinite(b.order) ? b.order : Number.POSITIVE_INFINITY;
      if (orderA !== orderB) return orderA - orderB;
      const indexA = sourceIndexById.get(a.id) ?? 0;
      const indexB = sourceIndexById.get(b.id) ?? 0;
      return indexA - indexB;
    });
    sorted.forEach((item, index) => {
      item.order = index;
    });
  });

  return normalizedList;
}

function getNextCategoryOrder(categories, parentId) {
  const normalizedParentId = parentId ?? null;
  let maxOrder = -1;
  categories.forEach((item) => {
    const currentParent = item.parentId ?? null;
    if (currentParent !== normalizedParentId) return;
    const order = Number.isFinite(item.order) ? item.order : -1;
    if (order > maxOrder) {
      maxOrder = order;
    }
  });
  return maxOrder + 1;
}

function normalizeStack(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeSocial(value, fallback) {
  if (value === undefined || value === null) return { ...fallback };
  const social = value && typeof value === 'object' ? value : {};
  const next = {};
  ['github', 'linkedin', 'twitter', 'instagram'].forEach((key) => {
    const raw = social[key];
    if (raw === undefined || raw === null) return;
    const trimmed = String(raw).trim();
    if (trimmed) {
      next[key] = trimmed;
    }
  });
  return next;
}

function normalizeProfile(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const stack =
    source.stack === undefined || source.stack === null
      ? defaultProfile.stack
      : normalizeStack(source.stack);
  return {
    title: normalizeRequiredString(source.title, defaultProfile.title),
    name: normalizeRequiredString(source.name, defaultProfile.name),
    role: normalizeRequiredString(source.role, defaultProfile.role),
    tagline: normalizeOptionalString(source.tagline, defaultProfile.tagline),
    description: normalizeRequiredString(source.description, defaultProfile.description),
    location: normalizeOptionalString(source.location, defaultProfile.location),
    profileImage: normalizeOptionalString(source.profileImage, defaultProfile.profileImage),
    email: normalizeOptionalString(source.email, defaultProfile.email),
    social: normalizeSocial(source.social, defaultProfile.social),
    stack,
    now: normalizeOptionalString(source.now, defaultProfile.now)
  };
}

function mergeProfile(current, input) {
  if (!input || typeof input !== 'object') return current;
  const next = { ...current };
  const requiredFields = new Set(['title', 'name', 'role', 'description']);
  [
    'title',
    'name',
    'role',
    'tagline',
    'description',
    'location',
    'profileImage',
    'email',
    'now'
  ].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      const raw = input[field];
      const trimmed = raw !== undefined && raw !== null ? String(raw).trim() : '';
      if (trimmed) {
        next[field] = trimmed;
      } else if (!requiredFields.has(field)) {
        next[field] = '';
      }
    }
  });

  if (Object.prototype.hasOwnProperty.call(input, 'stack')) {
    next.stack = normalizeStack(input.stack);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'social')) {
    const socialInput = input.social && typeof input.social === 'object' ? input.social : {};
    const nextSocial = { ...current.social };
    ['github', 'linkedin', 'twitter', 'instagram'].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(socialInput, key)) {
        const raw = socialInput[key];
        const trimmed = raw !== undefined && raw !== null ? String(raw).trim() : '';
        if (trimmed) {
          nextSocial[key] = trimmed;
        } else {
          delete nextSocial[key];
        }
      }
    });
    next.social = nextSocial;
  }

  return next;
}

async function addCategoryIfMissing(category) {
  const name = normalizeCategoryName(category);
  if (!name) return readCategories();
  const key = normalizeCategoryKey(name);
  const categories = await readCategories();
  if (categories.some(item => normalizeCategoryKey(item.name) === key)) {
    return categories;
  }
  const order = getNextCategoryOrder(categories, null);
  const next = [...categories, { id: randomUUID(), name, parentId: null, order }];
  return writeCategories(next);
}

async function removeCategoryByName(category) {
  const normalized = normalizeCategoryName(category);
  if (!normalized) {
    return { categories: await readCategories(), reassignedCount: 0, removed: false, reparentedCount: 0 };
  }
  const categories = await readCategories();
  const key = normalizeCategoryKey(normalized);
  const target =
    categories.find(item => item.id === normalized) ??
    categories.find(item => normalizeCategoryKey(item.name) === key);
  if (!target) {
    return { categories, reassignedCount: 0, removed: false, reparentedCount: 0 };
  }
  const defaultKey = normalizeCategoryKey(DEFAULT_CATEGORY);
  if (normalizeCategoryKey(target.name) === defaultKey) {
    return { categories, reassignedCount: 0, removed: false, reparentedCount: 0 };
  }
  const next = categories.filter(item => item.id !== target.id);
  let reparentedCount = 0;
  const reparented = next.map((item) => {
    if (item.parentId === target.id) {
      reparentedCount += 1;
      return { ...item, parentId: null, order: null };
    }
    return item;
  });
  const savedCategories = await writeCategories(reparented);

  const posts = await readPosts();
  let reassignedCount = 0;
  const updatedPosts = posts.map((post) => {
    if (normalizeCategoryKey(post.category) === normalizeCategoryKey(target.name)) {
      reassignedCount += 1;
      return { ...post, category: DEFAULT_CATEGORY };
    }
    return post;
  });
  if (reassignedCount > 0) {
    await writePosts(updatedPosts);
  }
  return { categories: savedCategories, reassignedCount, removed: true, reparentedCount };
}

async function updateCategoryById(id, updates) {
  const categories = await readCategories();
  const targetIndex = categories.findIndex(item => item.id === id);
  if (targetIndex < 0) {
    return { categories, updated: false, reason: 'not_found' };
  }

  const target = categories[targetIndex];
  const next = [...categories];
  let nextName = target.name;
  let nameChanged = false;

  if (Object.prototype.hasOwnProperty.call(updates, 'name')) {
    const normalized = normalizeCategoryName(updates.name);
    if (!normalized) {
      return { categories, updated: false, reason: 'name_required' };
    }
    if (normalizeCategoryKey(normalized) === normalizeCategoryKey(DEFAULT_CATEGORY)) {
      return { categories, updated: false, reason: 'default' };
    }
    const duplicate = categories.some(
      item =>
        item.id !== id &&
        normalizeCategoryKey(item.name) === normalizeCategoryKey(normalized)
    );
    if (duplicate) {
      return { categories, updated: false, reason: 'duplicate' };
    }
    nameChanged = normalizeCategoryKey(normalized) !== normalizeCategoryKey(target.name);
    nextName = normalized;
  }

  let nextParentId = target.parentId ?? null;
  let parentChanged = false;
  if (Object.prototype.hasOwnProperty.call(updates, 'parentId')) {
    const normalizedParentId = normalizeCategoryId(updates.parentId);
    if (!normalizedParentId) {
      nextParentId = null;
    } else {
      if (normalizedParentId === id) {
        return { categories, updated: false, reason: 'self_parent' };
      }
      const parent = categories.find(item => item.id === normalizedParentId);
      if (!parent) {
        return { categories, updated: false, reason: 'parent_not_found' };
      }
      if (normalizeCategoryKey(parent.name) === normalizeCategoryKey(DEFAULT_CATEGORY)) {
        return { categories, updated: false, reason: 'parent_default' };
      }
      let cursor = normalizedParentId;
      while (cursor) {
        if (cursor === id) {
          return { categories, updated: false, reason: 'cycle' };
        }
        const current = categories.find(item => item.id === cursor);
        cursor = current?.parentId ? String(current.parentId) : '';
      }
      nextParentId = normalizedParentId;
    }
    parentChanged = nextParentId !== (target.parentId ?? null);
  }

  let nextOrder = Number.isFinite(target.order) ? target.order : 0;
  if (parentChanged) {
    const siblings = categories.filter(item => item.id !== id);
    nextOrder = getNextCategoryOrder(siblings, nextParentId);
  }

  next[targetIndex] = {
    ...target,
    name: nextName,
    parentId: nextParentId,
    order: nextOrder
  };
  const savedCategories = await writeCategories(next);
  let reassignedCount = 0;

  if (nameChanged) {
    const posts = await readPosts();
    const updatedPosts = posts.map((post) => {
      if (normalizeCategoryKey(post.category) === normalizeCategoryKey(target.name)) {
        reassignedCount += 1;
        return { ...post, category: nextName };
      }
      return post;
    });
    if (reassignedCount > 0) {
      await writePosts(updatedPosts);
    }
  }

  return {
    categories: savedCategories,
    updated: true,
    reassignedCount,
    previousName: target.name,
    nextName
  };
}

function normalizeContentHtml(contentHtml) {
  if (!contentHtml) return '';
  return String(contentHtml).trim();
}

function parseDataUrl(dataUrl) {
  if (!dataUrl) return null;
  const match = /^data:([^;]+);base64,(.+)$/.exec(String(dataUrl).trim());
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  return { mime, buffer };
}

function normalizeSections(sections) {
  if (!Array.isArray(sections)) return [];

  return sections
    .map((section) => {
      if (!section || typeof section !== 'object') return null;
      const type = String(section.type);
      if (!allowedSectionTypes.has(type)) return null;

      if (type === 'list') {
        const items = Array.isArray(section.content) ? section.content : [];
        const cleaned = items.map(item => String(item).trim()).filter(Boolean);
        return cleaned.length ? { type, content: cleaned } : null;
      }

      if (type === 'code') {
        const content = section.content ? String(section.content) : '';
        if (!content.trim()) return null;
        const language = section.language ? String(section.language).trim() : '';
        return {
          type,
          content,
          language: language || undefined
        };
      }

      if (type === 'image') {
        const content = section.content ? String(section.content).trim() : '';
        if (!content) return null;
        const alt = section.alt ? String(section.alt).trim() : '';
        const caption = section.caption ? String(section.caption).trim() : '';
        return {
          type,
          content,
          alt: alt || undefined,
          caption: caption || undefined
        };
      }

      const content = section.content ? String(section.content).trim() : '';
      if (!content) return null;
      return { type, content };
    })
    .filter(Boolean);
}

function seedPosts() {
  return [
    {
      id: 'post-1',
      slug: 'designing-resilient-ui-state',
      title: '리액트에서 견고한 UI 상태 설계하기',
      summary: '로딩, 에러, 빈 상태까지 포함한 실전 체크리스트.',
      category: 'UI 설계',
      publishedAt: '2024-11-12',
      readingTime: '6분 읽기',
      tags: ['리액트', '상태', 'UX'],
      series: 'UI 회복력',
      featured: true,
      cover:
        'https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&w=1400&q=80',
      sections: [
        {
          type: 'paragraph',
          content:
            '견고한 UI 상태는 경계를 명확히 하는 것에서 시작됩니다. 로딩, 빈 상태, 에러를 예외가 아니라 기본 UI로 다루세요.'
        },
        {
          type: 'heading',
          content: '성공 경로와 실패 경로를 함께 설계하기'
        },
        {
          type: 'paragraph',
          content:
            '각 화면에는 명확한 기본 상태와 최소 한 가지 대안이 필요합니다. UI가 설명하지 못하면 사용자는 더 혼란스럽습니다.'
        },
        {
          type: 'list',
          content: [
            '네트워크 상태와 화면 상태를 분리한다.',
            '필터를 유지해 새로고침 시 UI가 초기화되지 않게 한다.',
            '스켈레톤은 체감 대기 시간을 줄일 때만 사용한다.'
          ]
        },
        {
          type: 'code',
          language: 'ts',
          content:
            "type Loadable<T> =\\n  | { status: 'idle' }\\n  | { status: 'loading' }\\n  | { status: 'ready'; data: T }\\n  | { status: 'error'; message: string };"
        },
        {
          type: 'callout',
          content: 'UI 상태 모델을 한 문장으로 설명할 수 없다면 이미 과합니다.'
        }
      ]
    },
    {
      id: 'post-2',
      slug: 'vite-express-monorepo-that-ships-fast',
      title: '빠르게 배송하는 Vite + Express 모노레포',
      summary: '로컬 개발 속도를 유지하면서 풀스택 프로토타입을 만드는 방법.',
      category: '개발 환경',
      publishedAt: '2024-10-28',
      readingTime: '5분 읽기',
      tags: ['툴링', 'Vite', 'Node'],
      series: '배송 플레이북',
      featured: true,
      cover:
        'https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1400&q=80',
      sections: [
        {
          type: 'paragraph',
          content:
            '모노레포가 무거울 필요는 없습니다. 로컬 피드백 루프를 2초 이내로 유지하고 컨텍스트 스위칭을 줄이는 것이 목표입니다.'
        },
        {
          type: 'heading',
          content: 'API는 가까이, 결합은 느슨하게'
        },
        {
          type: 'paragraph',
          content:
            'API 서버는 같은 레포에 두되 런타임은 분리합니다. Vite는 클라이언트를, Express는 JSON 저장소 기반의 영속화를 담당합니다.'
        },
        {
          type: 'code',
          language: 'bash',
          content: 'npm run dev\\n# and in another tab\\nnpm run server'
        },
        {
          type: 'list',
          content: [
            'API 베이스 URL은 하나로 통일한다.',
            '가능한 한 서버는 상태를 최소화한다.',
            '기본 데이터셋을 문서화해 바로 시작할 수 있게 한다.'
          ]
        },
        {
          type: 'quote',
          content: '온보딩이 10분을 넘는다면 레포가 너무 무겁다.'
        }
      ]
    },
    {
      id: 'post-3',
      slug: 'latency-budgets-for-client-apps',
      title: '클라이언트 앱을 위한 지연 예산',
      summary: '빠름의 기준을 정하고 UI를 그 예산에 맞추는 법.',
      category: '성능',
      publishedAt: '2024-09-18',
      readingTime: '4분 읽기',
      tags: ['성능', '제품', '아키텍처'],
      cover:
        'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80',
      sections: [
        {
          type: 'paragraph',
          content:
            '지연 예산은 사용자에게 하는 약속입니다. 예산을 정하면 로딩과 상호작용 상태를 더 솔직하게 설계할 수 있습니다.'
        },
        {
          type: 'heading',
          content: '체감 타임라인부터 시작하기'
        },
        {
          type: 'list',
          content: [
            '100ms 이내 피드백은 즉각적으로 느껴집니다.',
            '400ms 이후에는 진행 표시가 불안을 줄입니다.',
            '3초 이후에는 복구 옵션이 필요합니다.'
          ]
        },
        {
          type: 'callout',
          content: '90퍼센타일을 측정하세요. 대부분이 실제로 겪는 경험입니다.'
        }
      ]
    },
    {
      id: 'post-4',
      slug: 'design-tokens-for-typography-and-spacing',
      title: '타이포/간격 디자인 토큰 만들기',
      summary: '토큰 시스템은 리듬을 유지하고 시각적 부채를 줄입니다.',
      category: '디자인 시스템',
      publishedAt: '2024-08-29',
      readingTime: '5분 읽기',
      tags: ['디자인', 'CSS', '시스템'],
      cover:
        'https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&w=1400&q=80',
      sections: [
        {
          type: 'paragraph',
          content:
            '토큰은 의사결정을 위한 가드레일입니다. 타이포와 간격에서 가장 먼저 효과가 나타납니다.'
        },
        {
          type: 'heading',
          content: '리듬 스케일 만들기'
        },
        {
          type: 'list',
          content: [
            '간격은 4px 기반 그리드를 사용한다.',
            '폰트 크기와 일정한 행간을 함께 설계한다.',
            '가독성을 먼저, 밀도는 그다음에 둔다.'
          ]
        },
        {
          type: 'code',
          language: 'css',
          content: ':root {\\n  --space-2: 8px;\\n  --space-3: 12px;\\n  --space-4: 16px;\\n  --space-6: 24px;\\n}'
        },
        {
          type: 'quote',
          content: '일관성은 창의성을 죽이지 않습니다. 오히려 확장 가능하게 만듭니다.'
        }
      ]
    },
    {
      id: 'post-5',
      slug: 'practical-client-side-logging',
      title: '실전 클라이언트 로깅',
      summary: '콘솔을 어지럽히지 않으면서 디버깅에 도움이 되는 로깅.',
      category: '관측성',
      publishedAt: '2024-07-30',
      readingTime: '4분 읽기',
      tags: ['관측성', '디버깅', '타입스크립트'],
      cover:
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=80',
      sections: [
        {
          type: 'paragraph',
          content:
            '클라이언트 로그는 의도적이어야 합니다. 모든 클릭을 기록하지 말고 필요한 맥락만 담으세요.'
        },
        {
          type: 'heading',
          content: '최소한의 유용한 정보 정의하기'
        },
        {
          type: 'list',
          content: [
            '사용자 행동 + 타임스탬프',
            '화면 또는 컴포넌트 이름',
            '디버깅에 필요한 선택적 메타데이터'
          ]
        },
        {
          type: 'code',
          language: 'ts',
          content:
            "logger.info('User Action: Filter Changed', {\\n  tag: currentTag,\\n  query: searchQuery\\n});"
        },
        {
          type: 'callout',
          content: '로그는 개발자만의 출력이 아니라 제품 신호로 다뤄야 합니다.'
        }
      ]
    },
    {
      id: 'post-6',
      slug: 'infinite-scroll-vs-pagination',
      title: '무한 스크롤 vs 페이지네이션',
      summary: '사용자 의도에 따라 피드 경험을 선택하는 방법.',
      category: '제품 경험',
      publishedAt: '2024-06-18',
      readingTime: '3분 읽기',
      tags: ['제품', 'UX', '프론트엔드'],
      cover:
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=80',
      sections: [
        {
          type: 'paragraph',
          content:
            '무한 스크롤은 탐색에, 페이지네이션은 통제에 강합니다. 편의가 아니라 사용자 의도로 결정하세요.'
        },
        {
          type: 'heading',
          content: '사용자 목적에 맞춰 결정하기'
        },
        {
          type: 'list',
          content: [
            '탐색과 영감을 위한 브라우징에는 무한 스크롤을 사용한다.',
            '위치 인지가 필요할 때는 페이지네이션을 사용한다.',
            '검색이나 필터를 제공해 끝없는 스크롤을 줄인다.'
          ]
        },
        {
          type: 'quote',
          content: '콘텐츠가 가치 있을수록 멈출 수 있는 장치가 필요합니다.'
        }
      ]
    }
  ];
}

function isLegacySeed(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return false;
  const titles = posts.map(post => post?.title).filter(Boolean);
  return (
    titles.includes('Designing Resilient UI State in React') &&
    titles.includes('A Vite + Express Monorepo That Ships Fast')
  );
}

app.use('/api', createHealthRouter());
app.use(
  '/api/categories',
  createCategoryRouter({
    readCategories,
    writeCategories,
    removeCategoryByName,
    updateCategoryById,
    normalizeCategoryName,
    normalizeCategoryKey,
    normalizeCategoryId,
    getNextCategoryOrder,
    DEFAULT_CATEGORY
  })
);
app.use(
  '/api/profile',
  createProfileRouter({
    readProfile,
    writeProfile,
    mergeProfile
  })
);
app.use(
  '/api/posts',
  createPostRouter({
    readPosts,
    writePosts,
    addCategoryIfMissing,
    normalizeCategory,
    normalizePostStatus,
    normalizeScheduledAt,
    normalizeSeo,
    normalizeTags,
    normalizeSections,
    normalizeContentHtml
  })
);
app.use(
  '/api/uploads',
  createUploadRouter({
    parseDataUrl,
    allowedImageTypes,
    MAX_UPLOAD_BYTES,
    ensureUploadDir,
    writeFile,
    path,
    uploadDir
  })
);

async function start() {
  try {
    await ensurePostsFile();
    await ensureCategoriesFile();
    await ensureProfileFile();
    await ensureUploadDir();
    app.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

start();

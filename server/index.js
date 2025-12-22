import express from 'express';
import cors from 'cors';
import { access, mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

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

function normalizeCategory(category) {
  const normalized = category ? String(category).trim() : '';
  return normalized || DEFAULT_CATEGORY;
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
  list.forEach((item) => {
    const normalized = normalizeCategory(item);
    const key = normalizeCategoryKey(normalized);
    if (!categoryMap.has(key)) {
      categoryMap.set(key, normalized);
    }
  });
  const defaultKey = normalizeCategoryKey(DEFAULT_CATEGORY);
  if (!categoryMap.has(defaultKey)) {
    categoryMap.set(defaultKey, DEFAULT_CATEGORY);
  }
  return Array.from(categoryMap.values());
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
  const normalized = normalizeCategory(category);
  const key = normalizeCategoryKey(normalized);
  const categories = await readCategories();
  if (categories.some(item => normalizeCategoryKey(item) === key)) {
    return categories;
  }
  categories.push(normalized);
  return writeCategories(categories);
}

async function removeCategoryByName(category) {
  const normalized = normalizeCategory(category);
  const key = normalizeCategoryKey(normalized);
  const defaultKey = normalizeCategoryKey(DEFAULT_CATEGORY);
  if (key === defaultKey) {
    return { categories: await readCategories(), reassignedCount: 0, removed: false };
  }
  const categories = await readCategories();
  const next = categories.filter(item => normalizeCategoryKey(item) !== key);
  if (next.length === categories.length) {
    return { categories, reassignedCount: 0, removed: false };
  }
  await writeCategories(next);

  const posts = await readPosts();
  let reassignedCount = 0;
  const updatedPosts = posts.map((post) => {
    if (normalizeCategoryKey(post.category) === key) {
      reassignedCount += 1;
      return { ...post, category: DEFAULT_CATEGORY };
    }
    return post;
  });
  if (reassignedCount > 0) {
    await writePosts(updatedPosts);
  }
  return { categories: next, reassignedCount, removed: true };
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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/categories', async (_req, res) => {
  try {
    const categories = await readCategories();
    res.json({ categories, total: categories.length });
  } catch (error) {
    console.error('Failed to fetch categories', error);
    res.status(500).json({ message: '카테고리를 불러오지 못했습니다.' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body ?? {};
    const normalized = name ? String(name).trim() : '';
    if (!normalized) {
      return res.status(400).json({ message: '카테고리 이름이 필요합니다.' });
    }
    if (normalizeCategoryKey(normalized) === normalizeCategoryKey(DEFAULT_CATEGORY)) {
      return res.status(409).json({ message: '이미 존재하는 카테고리입니다.' });
    }
    const categories = await readCategories();
    const exists = categories.some(
      category => normalizeCategoryKey(category) === normalizeCategoryKey(normalized)
    );
    if (exists) {
      return res.status(409).json({ message: '이미 존재하는 카테고리입니다.' });
    }
    const next = await writeCategories([...categories, normalized]);
    res.status(201).json({ categories: next });
  } catch (error) {
    console.error('Failed to create category', error);
    res.status(500).json({ message: '카테고리 생성에 실패했습니다.' });
  }
});

app.delete('/api/categories/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const normalized = name ? String(name).trim() : '';
    if (!normalized) {
      return res.status(400).json({ message: '카테고리 이름이 필요합니다.' });
    }
    if (normalizeCategoryKey(normalized) === normalizeCategoryKey(DEFAULT_CATEGORY)) {
      return res.status(400).json({ message: '기본 카테고리는 삭제할 수 없습니다.' });
    }
    const result = await removeCategoryByName(normalized);
    if (!result.removed) {
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }
    res.json({ categories: result.categories, reassignedCount: result.reassignedCount });
  } catch (error) {
    console.error('Failed to delete category', error);
    res.status(500).json({ message: '카테고리 삭제에 실패했습니다.' });
  }
});

app.get('/api/profile', async (_req, res) => {
  try {
    const profile = await readProfile();
    res.json({ profile });
  } catch (error) {
    console.error('Failed to fetch profile', error);
    res.status(500).json({ message: '프로필을 불러오지 못했습니다.' });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const profile = await readProfile();
    const next = mergeProfile(profile, req.body ?? {});
    const saved = await writeProfile(next);
    res.json({ profile: saved });
  } catch (error) {
    console.error('Failed to update profile', error);
    res.status(500).json({ message: '프로필 저장에 실패했습니다.' });
  }
});

app.get('/api/posts', async (_req, res) => {
  try {
    const posts = await readPosts();
    res.json({ posts, total: posts.length });
  } catch (error) {
    console.error('Failed to fetch posts', error);
    res.status(500).json({ message: '포스트를 불러오지 못했습니다.' });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const {
      slug,
      title,
      summary,
      contentHtml,
      category,
      status,
      scheduledAt,
      seo,
      publishedAt,
      readingTime,
      tags,
      series,
      featured,
      cover,
      sections
    } = req.body ?? {};

    const normalizedSlug = slug ? String(slug).trim() : '';
    const normalizedTitle = title ? String(title).trim() : '';

    if (!normalizedSlug || !normalizedTitle) {
      return res.status(400).json({ message: '슬러그와 제목이 필요합니다.' });
    }

    const normalizedSections = normalizeSections(sections);
    const normalizedContentHtml = normalizeContentHtml(contentHtml);
    const normalizedStatus = normalizePostStatus(status);
    if (
      normalizedStatus !== 'draft' &&
      normalizedSections.length === 0 &&
      !normalizedContentHtml
    ) {
      return res.status(400).json({ message: '본문 내용이 필요합니다.' });
    }

    const allPosts = await readPosts();
    if (allPosts.some(post => post.slug === normalizedSlug)) {
      return res.status(409).json({ message: '슬러그가 이미 존재합니다.' });
    }

    const normalizedTags = normalizeTags(tags);
    const normalizedSeries = series ? String(series).trim() : '';
    const normalizedCover = cover ? String(cover).trim() : '';
    const normalizedReadingTime = readingTime ? String(readingTime).trim() : '';
    const normalizedCategory = normalizeCategory(category);
    const normalizedScheduledAt = normalizeScheduledAt(scheduledAt);
    if (normalizedStatus === 'scheduled' && !normalizedScheduledAt) {
      return res.status(400).json({ message: '예약 발행 날짜가 필요합니다.' });
    }
    const normalizedSeo = normalizeSeo(seo);
    await addCategoryIfMissing(normalizedCategory);
    const normalizedPublishedAt = publishedAt
      ? String(publishedAt)
      : new Date().toISOString().slice(0, 10);
    const effectivePublishedAt =
      normalizedStatus === 'scheduled' && normalizedScheduledAt
        ? normalizedScheduledAt.slice(0, 10)
        : normalizedPublishedAt;

    const newPost = {
      id: `post-${randomUUID()}`,
      slug: normalizedSlug,
      title: normalizedTitle,
      summary: summary ? String(summary).trim() : '요약이 없습니다.',
      category: normalizedCategory,
      contentHtml: normalizedContentHtml || undefined,
      publishedAt: effectivePublishedAt,
      readingTime: normalizedReadingTime || '3분 읽기',
      tags: normalizedTags,
      series: normalizedSeries || undefined,
      featured: Boolean(featured),
      cover: normalizedCover || undefined,
      status: normalizedStatus,
      scheduledAt: normalizedScheduledAt || undefined,
      seo: normalizedSeo,
      sections: normalizedSections
    };

    const next = [newPost, ...allPosts];
    await writePosts(next);

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Failed to create post', error);
    res.status(500).json({ message: '포스트 생성에 실패했습니다.' });
  }
});

app.put('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allPosts = await readPosts();
    const index = allPosts.findIndex(post => post.id === id);

    if (index === -1) {
      return res.status(404).json({ message: '포스트를 찾을 수 없습니다.' });
    }

    const existing = allPosts[index];
    const {
      slug,
      title,
      summary,
      contentHtml,
      category,
      status,
      scheduledAt,
      seo,
      publishedAt,
      readingTime,
      tags,
      series,
      featured,
      cover,
      sections
    } = req.body ?? {};

    const normalizedSlug = slug ? String(slug).trim() : existing.slug;
    const normalizedTitle = title ? String(title).trim() : existing.title;

    if (!normalizedSlug || !normalizedTitle) {
      return res.status(400).json({ message: '슬러그와 제목이 필요합니다.' });
    }

    if (allPosts.some(post => post.slug === normalizedSlug && post.id !== id)) {
      return res.status(409).json({ message: '슬러그가 이미 존재합니다.' });
    }

    const normalizedSections =
      sections !== undefined ? normalizeSections(sections) : existing.sections ?? [];
    const normalizedContentHtml =
      contentHtml !== undefined
        ? normalizeContentHtml(contentHtml)
        : normalizeContentHtml(existing.contentHtml);
    const normalizedStatus =
      status !== undefined ? normalizePostStatus(status) : normalizePostStatus(existing.status);
    if (
      normalizedStatus !== 'draft' &&
      normalizedSections.length === 0 &&
      !normalizedContentHtml
    ) {
      return res.status(400).json({ message: '본문 내용이 필요합니다.' });
    }

    const normalizedSeries = series !== undefined ? String(series).trim() : '';
    const normalizedCover = cover !== undefined ? String(cover).trim() : '';
    const normalizedReadingTime = readingTime ? String(readingTime).trim() : '';
    const normalizedCategory =
      category !== undefined ? normalizeCategory(category) : normalizeCategory(existing.category);
    const normalizedScheduledAt =
      scheduledAt !== undefined
        ? normalizeScheduledAt(scheduledAt)
        : normalizeScheduledAt(existing.scheduledAt);
    if (normalizedStatus === 'scheduled' && !normalizedScheduledAt) {
      return res.status(400).json({ message: '예약 발행 날짜가 필요합니다.' });
    }
    const normalizedSeo = seo !== undefined ? normalizeSeo(seo) : normalizeSeo(existing.seo);
    await addCategoryIfMissing(normalizedCategory);
    const normalizedPublishedAt =
      publishedAt !== undefined ? String(publishedAt) : existing.publishedAt;
    const effectivePublishedAt =
      normalizedStatus === 'scheduled' && normalizedScheduledAt
        ? normalizedScheduledAt.slice(0, 10)
        : normalizedPublishedAt;

    const updated = {
      ...existing,
      slug: normalizedSlug,
      title: normalizedTitle,
      summary: summary !== undefined ? String(summary).trim() : existing.summary,
      category: normalizedCategory,
      contentHtml: normalizedContentHtml || undefined,
      publishedAt: effectivePublishedAt,
      readingTime: normalizedReadingTime || existing.readingTime,
      tags: tags !== undefined ? normalizeTags(tags) : existing.tags,
      series: series !== undefined ? normalizedSeries || undefined : existing.series,
      featured: featured !== undefined ? Boolean(featured) : existing.featured,
      cover: cover !== undefined ? normalizedCover || undefined : existing.cover,
      status: normalizedStatus,
      scheduledAt: normalizedScheduledAt || undefined,
      seo: normalizedSeo,
      sections: normalizedSections
    };

    allPosts[index] = updated;
    await writePosts(allPosts);

    res.json(updated);
  } catch (error) {
    console.error('Failed to update post', error);
    res.status(500).json({ message: '포스트 수정에 실패했습니다.' });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allPosts = await readPosts();
    const next = allPosts.filter(post => post.id !== id);

    if (next.length === allPosts.length) {
      return res.status(404).json({ message: '포스트를 찾을 수 없습니다.' });
    }

    await writePosts(next);
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete post', error);
    res.status(500).json({ message: '포스트 삭제에 실패했습니다.' });
  }
});

app.post('/api/uploads', async (req, res) => {
  try {
    const { dataUrl } = req.body ?? {};
    const parsed = parseDataUrl(dataUrl);

    if (!parsed) {
      return res.status(400).json({ message: '이미지 데이터가 올바르지 않습니다.' });
    }

    const extension = allowedImageTypes.get(parsed.mime);
    if (!extension) {
      return res.status(400).json({ message: '지원하지 않는 이미지 형식입니다.' });
    }

    if (!parsed.buffer.length) {
      return res.status(400).json({ message: '빈 파일은 업로드할 수 없습니다.' });
    }

    if (parsed.buffer.length > MAX_UPLOAD_BYTES) {
      return res.status(413).json({ message: '이미지 용량이 너무 큽니다.' });
    }

    await ensureUploadDir();
    const filename = `upload-${Date.now()}-${randomUUID()}.${extension}`;
    await writeFile(path.join(uploadDir, filename), parsed.buffer);

    res.status(201).json({
      url: `/uploads/${filename}`,
      filename
    });
  } catch (error) {
    console.error('Failed to upload image', error);
    res.status(500).json({ message: '이미지 업로드에 실패했습니다.' });
  }
});

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

import { randomUUID } from 'crypto';

export const allowedPostStatuses = new Set(['draft', 'scheduled', 'published']);
export const DEFAULT_CATEGORY = '미분류';
export const allowedImageTypes = new Map([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
    ['image/gif', 'gif'],
    ['image/avif', 'avif']
]);

export const allowedSectionTypes = new Set([
    'heading',
    'paragraph',
    'list',
    'code',
    'quote',
    'callout',
    'image'
]);

export const defaultProfile = {
    title: 'Blog Title',
    name: 'Author Name',
    role: 'Role',
    tagline: 'Tagline',
    description: 'Description',
    location: 'Location',
    profileImage: '',
    email: '',
    social: {},
    stack: [],
    now: ''
};

export function normalizeTags(tags) {
    if (!Array.isArray(tags)) return [];
    return tags.map(tag => String(tag).trim()).filter(Boolean);
}

export function normalizeCategoryName(value) {
    return value !== undefined && value !== null ? String(value).trim() : '';
}

export function normalizeCategory(category) {
    const normalized = normalizeCategoryName(category);
    return normalized || DEFAULT_CATEGORY;
}

export function normalizeCategoryId(value) {
    const normalized = normalizeCategoryName(value);
    return normalized || '';
}

export function normalizeCategoryOrder(value) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    if (parsed < 0) return null;
    return Math.floor(parsed);
}

export function normalizePostStatus(status) {
    const normalized = status ? String(status).toLowerCase().trim() : '';
    if (allowedPostStatuses.has(normalized)) return normalized;
    return 'published';
}

export function normalizeScheduledAt(value) {
    if (!value) return '';
    const timestamp = new Date(String(value)).getTime();
    if (Number.isNaN(timestamp)) return '';
    return new Date(timestamp).toISOString();
}

export function normalizeSeo(seo) {
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

export function normalizeRequiredString(value, fallback) {
    const normalized = value !== undefined && value !== null ? String(value).trim() : '';
    return normalized || fallback;
}

export function normalizeOptionalString(value, fallback) {
    if (value === undefined || value === null) return fallback;
    return String(value).trim();
}

export function normalizeCategoryKey(category) {
    return normalizeCategory(category).toLowerCase();
}

export function normalizeCategoryList(categories) {
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
                return; // Cycle detected
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

export function getNextCategoryOrder(categories, parentId) {
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

export function normalizeStack(value) {
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

export function normalizeSocial(value, fallback) {
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

export function normalizeProfile(raw) {
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

export function mergeProfile(current, input) {
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

export function normalizeContentHtml(contentHtml) {
    if (!contentHtml) return '';
    return String(contentHtml).trim();
}

export function parseDataUrl(dataUrl) {
    if (!dataUrl) return null;
    const match = /^data:([^;]+);base64,(.+)$/.exec(String(dataUrl).trim());
    if (!match) return null;
    const mime = match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    return { mime, buffer };
}

export function normalizeSections(sections) {
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

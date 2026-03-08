export function normalizeRequiredString(value, fallback) {
    const normalized = value !== undefined && value !== null ? String(value).trim() : '';
    return normalized || fallback;
}

export function normalizeOptionalString(value, fallback) {
    if (value === undefined || value === null) return fallback;
    return String(value).trim();
}

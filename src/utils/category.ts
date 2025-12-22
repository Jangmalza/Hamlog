export const normalizeCategoryName = (value: string) => value.trim();

export const normalizeCategoryKey = (value: string) =>
  normalizeCategoryName(value).toLowerCase();

export const normalizeDraftCategory = (value: string, fallback: string) => {
  const normalized = normalizeCategoryName(value);
  return normalized || fallback;
};

export const sortCategories = (values: string[], locale: string = 'ko') =>
  [...values].sort((a, b) => a.localeCompare(b, locale));

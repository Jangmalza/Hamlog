export type ImageWidthParseResult =
  | { kind: 'clear' }
  | { kind: 'error'; message: string }
  | {
      kind: 'value';
      cssValue: string;
      widthAttr: string;
      dataWidth: string;
      displayValue: string;
    };

export const extractImageWidth = (attrs: Record<string, string>) => {
  if (attrs.dataWidth) {
    const value = String(attrs.dataWidth);
    if (value.endsWith('%')) return '';
    if (value.endsWith('px')) return value.replace('px', '');
    return value;
  }
  if (attrs.width) return String(attrs.width);
  if (attrs.style) {
    const match = String(attrs.style).match(/width\s*:\s*([^;]+)/i);
    if (match) {
      const value = match[1].trim();
      if (value.endsWith('%')) return '';
      if (value.endsWith('px')) return value.replace('px', '');
      return value;
    }
  }
  return '';
};

export const parseImageWidthInput = (value: string): ImageWidthParseResult => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return { kind: 'clear' };
  if (trimmed === 'auto' || trimmed === '기본') {
    return { kind: 'clear' };
  }
  if (trimmed.includes('%')) {
    return {
      kind: 'error',
      message: '퍼센트는 지원하지 않습니다. px로 입력하세요.'
    };
  }

  const pxMatch = trimmed.match(/^(\d+(?:\.\d+)?)(px)?$/);
  if (pxMatch) {
    const px = Number(pxMatch[1]);
    if (!Number.isFinite(px) || px <= 0 || px > 2000) {
      return { kind: 'error', message: '너비는 1~2000px 범위로 입력하세요.' };
    }
    const rounded = Math.round(px);
    return {
      kind: 'value',
      cssValue: `${rounded}px`,
      widthAttr: String(rounded),
      dataWidth: `${rounded}px`,
      displayValue: String(rounded)
    };
  }
  return {
    kind: 'error',
    message: '예: 640 또는 640px 형식으로 입력하세요.'
  };
};

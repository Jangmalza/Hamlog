export const allowedImageTypes = new Map([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
    ['image/gif', 'gif'],
    ['image/avif', 'avif']
]);

export function parseDataUrl(dataUrl) {
    if (!dataUrl) return null;
    const match = /^data:([^;]+);base64,(.+)$/.exec(String(dataUrl).trim());
    if (!match) return null;
    const mime = match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    return { mime, buffer };
}

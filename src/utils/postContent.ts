import type { JSONContent } from '@tiptap/core';
import type { PostSection } from '../data/blogData';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const hasMeaningfulContentNode = (node: unknown): boolean => {
  if (!node || typeof node !== 'object') return false;

  const typedNode = node as {
    type?: string;
    text?: string;
    attrs?: Record<string, unknown>;
    content?: unknown[];
  };

  if (typedNode.type === 'text') {
    return typeof typedNode.text === 'string' && typedNode.text.trim().length > 0;
  }

  if (typedNode.type === 'hardBreak' || typedNode.type === 'horizontalRule') {
    return true;
  }

  if (typedNode.type === 'image') {
    return typeof typedNode.attrs?.src === 'string' && typedNode.attrs.src.trim().length > 0;
  }

  if (typedNode.type === 'linkCard') {
    return typeof typedNode.attrs?.url === 'string' && typedNode.attrs.url.trim().length > 0;
  }

  if (typedNode.type === 'youtube') {
    return typeof typedNode.attrs?.src === 'string' && typedNode.attrs.src.trim().length > 0;
  }

  if (typedNode.type === 'math') {
    return typeof typedNode.attrs?.latex === 'string' && typedNode.attrs.latex.trim().length > 0;
  }

  if (typedNode.type === 'table' || typedNode.type === 'imageGallery' || typedNode.type === 'columns') {
    return true;
  }

  if (Array.isArray(typedNode.content)) {
    return typedNode.content.some(child => hasMeaningfulContentNode(child));
  }

  return false;
};

export const hasDocumentContent = (contentJson?: JSONContent) =>
  Boolean(contentJson && hasMeaningfulContentNode(contentJson));

export const normalizeContentJsonForDirtyCheck = (contentJson?: JSONContent) => (
  contentJson && hasMeaningfulContentNode(contentJson) ? contentJson : null
);

export const normalizeContentHtmlForDirtyCheck = (contentHtml: string) => (
  stripHtml(contentHtml).length > 0 ? contentHtml : ''
);

export const sectionsToHtml = (sections: PostSection[]) =>
  sections
    .map(section => {
      switch (section.type) {
        case 'heading':
          return `<h2>${escapeHtml(section.content)}</h2>`;
        case 'paragraph':
          return `<p>${escapeHtml(section.content)}</p>`;
        case 'list':
          return `<ul>${section.content
            .map(item => `<li>${escapeHtml(item)}</li>`)
            .join('')}</ul>`;
        case 'code':
          return `<pre><code>${escapeHtml(section.content)}</code></pre>`;
        case 'quote':
          return `<blockquote>${escapeHtml(section.content)}</blockquote>`;
        case 'callout':
          return `<blockquote>${escapeHtml(section.content)}</blockquote>`;
        case 'image':
          return `<figure><img src="${escapeHtml(section.content)}" alt="${escapeHtml(
            section.alt ?? ''
          )}" />${
            section.caption
              ? `<figcaption>${escapeHtml(section.caption)}</figcaption>`
              : ''
          }</figure>`;
        default:
          return '';
      }
    })
    .join('');

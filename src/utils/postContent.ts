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

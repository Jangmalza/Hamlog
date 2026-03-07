import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { readPosts } from '../models/postModel.js';
import { readProfile } from '../models/profileModel.js';
import { filterPublicPosts, findPublicPostBySlug } from '../utils/postVisibility.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = 'https://tech.hamwoo.co.kr';

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const toAbsoluteUrl = (value = '') => {
  if (!value) return `${BASE_URL}/avatar.jpg`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
};

export const injectPostMeta = async (req, res) => {
  try {
    const { slug } = req.params;
    const posts = await readPosts();
    const post = findPublicPostBySlug(posts, slug);

    const indexPath = path.join(__dirname, '../../dist/index.html');
    let html = await readFile(indexPath, 'utf8');

    if (post) {
      const title = post.seo?.title || post.title;
      const description = post.seo?.description || post.summary;
      const image = toAbsoluteUrl(post.seo?.ogImage || post.cover || '/avatar.jpg');
      const fullUrl = `${BASE_URL}/posts/${post.slug}`;
      const escapedTitle = escapeHtml(title);
      const escapedDescription = escapeHtml(description);
      const escapedImage = escapeHtml(image);
      const escapedFullUrl = escapeHtml(fullUrl);

      // Update basic meta
      html = html.replace(/<title>.*?<\/title>/, `<title>${escapedTitle}</title>`);
      html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapedDescription}" />`);

      // Update OG meta
      html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapedTitle}" />`);
      html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapedDescription}" />`);
      html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${escapedFullUrl}" />`);
      html = html.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${escapedImage}" />`);

      // Update Twitter meta
      html = html.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${escapedTitle}" />`);
      html = html.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${escapedDescription}" />`);
      html = html.replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${escapedImage}" />`);
    }

    res.send(html);
  } catch (error) {
    console.error('Meta injection error:', error);
    // Fallback to regular file if injection fails
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  }
};

export const getRss = async (req, res) => {
  try {
    const posts = await readPosts();
    const profile = await readProfile();
    const publishedPosts = filterPublicPosts(posts)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const items = publishedPosts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${BASE_URL}/posts/${post.slug}</link>
      <guid>${BASE_URL}/posts/${post.slug}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${post.summary}]]></description>
      <content:encoded><![CDATA[${post.contentHtml || ''}]]></content:encoded>
      ${post.category ? `<category>${post.category}</category>` : ''}
    </item>`).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${profile.title}</title>
    <link>${BASE_URL}</link>
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
};

export const getSitemap = async (req, res) => {
  try {
    const posts = await readPosts();
    const publishedPosts = filterPublicPosts(posts);

    const urls = publishedPosts.map(post => `
  <url>
    <loc>${BASE_URL}/posts/${post.slug}</loc>
    <lastmod>${post.publishedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}</loc>
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
};

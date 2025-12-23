import { readPosts } from '../models/postModel.js';
import { readProfile } from '../models/profileModel.js';

const BASE_URL = 'https://hamlog.dev'; // Ideally from config/env

export const getRss = async (req, res) => {
    try {
        const posts = await readPosts();
        const profile = await readProfile();
        const publishedPosts = posts
            .filter(p => p.status === 'published')
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        const items = publishedPosts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${BASE_URL}/posts/${post.slug}</link>
      <guid>${BASE_URL}/posts/${post.slug}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${post.summary}]]></description>
      ${post.category ? `<category>${post.category}</category>` : ''}
    </item>`).join('');

        const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
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
        const publishedPosts = posts.filter(p => p.status === 'published');

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

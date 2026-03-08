import { useEffect } from 'react';
import type { Post } from '../types/blog';

interface UseSchemaProps {
    post: Post | undefined;
}

const BASE_URL = 'https://tech.hamwoo.co.kr';

const toAbsoluteUrl = (value?: string) => {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return `${BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
};

export const useSchema = ({ post }: UseSchemaProps) => {
    useEffect(() => {
        if (!post) return;

        const canonicalUrl = post.seo?.canonicalUrl || `${BASE_URL}/posts/${post.slug}`;
        const imageUrl = toAbsoluteUrl(post.seo?.ogImage ?? post.cover);

        const schema = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.seo?.title ?? post.title,
            "image": imageUrl ? [imageUrl] : [],
            "datePublished": post.publishedAt,
            "dateModified": post.publishedAt,
            "mainEntityOfPage": canonicalUrl,
            "url": canonicalUrl,
            "author": {
                "@type": "Person",
                "name": "Hamwoo",
                "url": BASE_URL
            },
            "publisher": {
                "@type": "Organization",
                "name": "HamLog",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${BASE_URL}/avatar.jpg`
                }
            },
            "description": post.seo?.description ?? post.summary,
            "articleSection": post.category,
            "keywords": post.tags.join(', ')
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schema).replace(/</g, '\\u003c');
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, [post]);
};

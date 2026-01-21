import { useEffect } from 'react';
import type { Post } from '../types/blog';

interface UseSchemaProps {
    post: Post | undefined;
}

export const useSchema = ({ post }: UseSchemaProps) => {
    useEffect(() => {
        if (!post) return;

        const schema = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.seo?.title ?? post.title,
            "image": post.cover ? [post.cover] : [],
            "datePublished": post.publishedAt,
            "dateModified": post.publishedAt,
            "author": {
                "@type": "Person",
                "name": "Hamwoo",
                "url": "https://tech.hamwoo.co.kr"
            },
            "publisher": {
                "@type": "Organization",
                "name": "HamLog",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://tech.hamwoo.co.kr/avatar.jpg"
                }
            },
            "description": post.seo?.description ?? post.summary
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, [post]);
};

import { useEffect } from 'react';

interface SeoProps {
    title?: string;
    description?: string;
    image?: string;
    keywords?: string[];
    url?: string;
    type?: 'article' | 'website';
}

export const useSeo = ({
    title,
    description,
    image,
    keywords,
    url,
    type = 'article',
}: SeoProps) => {
    useEffect(() => {
        if (typeof document === 'undefined') return;

        const seoTitle = title ?? '';
        const seoDescription = description ?? '';
        const seoImage = image ?? '';
        const seoKeywords = keywords?.join(', ') ?? '';
        const canonicalUrl = url ?? window.location.href;

        if (seoTitle) {
            document.title = seoTitle;
        }

        const setMetaTag = (key: string, content: string, attr: 'name' | 'property') => {
            const selector = `meta[${attr}="${key}"]`;
            let element = document.head.querySelector(selector) as HTMLMetaElement | null;
            if (!content) {
                if (element) element.remove();
                return;
            }
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attr, key);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        const setLinkTag = (rel: string, href: string) => {
            const selector = `link[rel="${rel}"]`;
            let element = document.head.querySelector(selector) as HTMLLinkElement | null;
            if (!href) {
                if (element) element.remove();
                return;
            }
            if (!element) {
                element = document.createElement('link');
                element.setAttribute('rel', rel);
                document.head.appendChild(element);
            }
            element.setAttribute('href', href);
        };

        setMetaTag('description', seoDescription, 'name');
        setMetaTag('keywords', seoKeywords, 'name');
        setMetaTag('og:title', seoTitle, 'property');
        setMetaTag('og:description', seoDescription, 'property');
        setMetaTag('og:image', seoImage, 'property');
        setMetaTag('og:type', type, 'property');
        setMetaTag('og:url', canonicalUrl, 'property');
        setMetaTag('twitter:card', seoImage ? 'summary_large_image' : 'summary', 'name');
        setMetaTag('twitter:title', seoTitle, 'name');
        setMetaTag('twitter:description', seoDescription, 'name');
        setMetaTag('twitter:image', seoImage, 'name');
        setLinkTag('canonical', canonicalUrl);
    }, [title, description, image, keywords, url, type]);
};

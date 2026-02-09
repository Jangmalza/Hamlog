import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';

export interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    contentSelector?: string; // CSS selector for the content area to spy on
    tocItems?: TocItem[]; // If provided directly (e.g. from editor state)
    className?: string;
    onLinkClick?: (id: string) => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
    contentSelector,
    tocItems: providedItems,
    className,
    onLinkClick
}) => {
    const [items, setItems] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    // 1. Generate TOC items from DOM if not provided
    useEffect(() => {
        if (providedItems) {
            setItems(providedItems);
            return;
        }

        if (!contentSelector) return;

        const contentElement = document.querySelector(contentSelector);
        if (!contentElement) return;

        const headings = contentElement.querySelectorAll('h1, h2, h3');
        const newItems: TocItem[] = [];

        headings.forEach((heading, index) => {
            // Ensure ID exists
            if (!heading.id) {
                heading.id = `heading-${index}-${heading.textContent?.slice(0, 10).replace(/\s+/g, '-')}`;
            }

            newItems.push({
                id: heading.id,
                text: heading.textContent || '',
                level: parseInt(heading.tagName.substring(1))
            });
        });

        setItems(newItems);
    }, [contentSelector, providedItems]);

    // 2. Scroll Spy Logic
    useEffect(() => {
        if (!items.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-10% 0px -80% 0px' } // Trigger when element is near top
        );

        items.forEach((item) => {
            const element = document.getElementById(item.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [items]);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        onLinkClick?.(id);

        const element = document.getElementById(id);
        if (element) {
            // Offset for sticky headers if needed
            const yOffset = -100;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    if (items.length === 0) return null;

    return (
        <nav className={clsx("toc-nav", className)} aria-label="Table of Contents">
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                목차
            </h4>
            <ul className="space-y-2 border-l border-[var(--border)]">
                {items.map((item) => (
                    <li key={item.id} className={clsx(
                        "relative pl-4 transition-all duration-200",
                        item.level === 3 && "pl-8"
                    )}>
                        <a
                            href={`#${item.id}`}
                            onClick={(e) => handleClick(e, item.id)}
                            className={clsx(
                                "block text-sm transition-colors duration-200 hover:text-[var(--accent)]",
                                activeId === item.id
                                    ? "font-medium text-[var(--accent)]"
                                    : "text-[var(--text-muted)]"
                            )}
                        >
                            {activeId === item.id && (
                                <span className="absolute -left-[1px] top-0 h-full w-[2px] bg-[var(--accent)]" />
                            )}
                            {item.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidBlockProps {
    code: string;
}

const MermaidBlock: React.FC<MermaidBlockProps> = ({ code }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Initialize mermaid
        mermaid.initialize({
            startOnLoad: false,
            theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default',
            securityLevel: 'loose',
        });

        const renderChart = async () => {
            if (!containerRef.current) return;

            try {
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

                // Aggressive sanitization:
                // 1. Replace non-breaking spaces (\u00A0) with normal spaces
                // 2. Remove zero-width spaces (\u200B) and other hidden controls
                // 3. Decode common entities manually just in case
                let sanitizedCode = code
                    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
                    .replace(/&gt;/g, '>')
                    .replace(/&lt;/g, '<')
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&')
                    .trim();

                const { svg: svgContent } = await mermaid.render(id, sanitizedCode);
                setSvg(svgContent);
                setError(null);
            } catch (err) {
                console.error('Mermaid rendering failed:', err);
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(`다이어그램을 렌더링할 수 없습니다. (${errorMessage})`);
                // Mermaid leaves error text in the DOM, so we might want to clean up or handle it
            }
        };

        renderChart();
    }, [code]);

    if (error) {
        return (
            <div className="my-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
                <p className="font-semibold">Mermaid Error:</p>
                <p>{error}</p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-white/50 p-2 text-xs dark:bg-black/20">
                    {code}
                </pre>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="my-6 flex justify-center overflow-x-auto rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-4 shadow-sm"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

export default MermaidBlock;

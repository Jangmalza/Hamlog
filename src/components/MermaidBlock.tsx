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
                // Ensure ID starts with a letter to be a valid CSS selector
                const id = `mermaid-chart-${Math.random().toString(36).substr(2, 9)}`;

                // Aggressive sanitization (remove ZWS, NBSP, etc)
                // We do NOT use innerHTML/DOMParser here to prevent stripping <AngleBrackets> in mermaid code (e.g. Generics)
                const sanitizedCode = code
                    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
                    .trim();

                const { svg: svgContent } = await mermaid.render(id, sanitizedCode);
                setSvg(svgContent);
                setError(null);
            } catch (err) {
                console.error('Mermaid rendering failed:', err);
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';

                // Debug info: show first few chars in Hex to detect hidden bombs
                const debugHex = code.substring(0, 20).split('').map(c => c.charCodeAt(0).toString(16)).join(' ');

                setError(`다이어그램을 렌더링할 수 없습니다. (${errorMessage})\nDebug: ${debugHex}`);
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

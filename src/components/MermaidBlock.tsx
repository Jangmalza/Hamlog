import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidBlockProps {
    code: string;
}

const MermaidBlock: React.FC<MermaidBlockProps> = ({ code }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<{ raw: string, sanitized: string, hex: string }>({ raw: '', sanitized: '', hex: '' });

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default',
            securityLevel: 'loose',
        });

        const renderChart = async () => {
            if (!containerRef.current) return;

            // Ensure ID starts with a letter to be a valid CSS selector
            const id = `mermaid-chart-${Math.random().toString(36).substr(2, 9)}`;

            // Aggressive sanitization
            const sanitizedCode = code
                .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
                .trim();

            // Set debug info
            setDebugInfo({
                raw: code,
                sanitized: sanitizedCode,
                hex: code.substring(0, 20).split('').map(c => `${c} (${c.charCodeAt(0).toString(16)})`).join(' ')
            });

            try {
                // Try parse first (optional in v10 but good for safety)
                // await mermaid.parse(sanitizedCode); 

                const { svg: svgContent } = await mermaid.render(id, sanitizedCode);
                setSvg(svgContent);
                setError(null);
            } catch (err) {
                console.error('Mermaid rendering failed:', err);
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(`다이어그램을 렌더링할 수 없습니다. (${errorMessage})`);
            }
        };

        renderChart();
    }, [code]);

    if (error) {
        return (
            <div className="my-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
                <p className="font-semibold">Mermaid Error:</p>
                <p>{error}</p>
                <details className="mt-2">
                    <summary className="cursor-pointer text-xs opacity-50 hover:opacity-100">Debug Info</summary>
                    <div className="mt-1 rounded bg-black/20 p-2 text-[10px] font-mono whitespace-pre-wrap">
                        <p className="font-bold text-white/50">Raw Input:</p>
                        <pre>{debugInfo.raw}</pre>

                        <p className="mt-2 font-bold text-white/50">Sanitized Input (Passed to Mermaid):</p>
                        <pre className="text-green-300">{debugInfo.sanitized}</pre>

                        <p className="mt-2 font-bold text-white/50">Hex Dump (First 20 chars):</p>
                        <pre>{debugInfo.hex}</pre>
                    </div>
                </details>
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

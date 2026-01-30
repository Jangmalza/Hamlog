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
                const { svg: svgContent } = await mermaid.render(id, code);
                setSvg(svgContent);
                setError(null);
            } catch (err) {
                console.error('Mermaid rendering failed:', err);
                setError('다이어그램을 렌더링할 수 없습니다. 문법을 확인해주세요.');
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

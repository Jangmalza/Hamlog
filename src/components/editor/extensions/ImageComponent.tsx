import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useEditorAction } from '../../../contexts/EditorActionContext';


export const ImageComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
    const { src, alt, width, style, caption } = node.attrs;

    // Safely consume context - might be null if used outside provider (e.g. preview)
    let onSetCover: ((src: string) => void) | undefined;
    let currentCoverUrl: string | undefined;
    try {
        const ctx = useEditorAction();
        onSetCover = ctx.onSetCover;
        currentCoverUrl = ctx.currentCoverUrl;
    } catch (e) {
        // Ignore context error if not available
    }

    // Normalize logic for comparison (handle potential relative vs absolute or query params if improved later)
    // For now, strict string equality is likely sufficient if urls come from same source
    const isCover = currentCoverUrl && src && currentCoverUrl === src;

    const handleResize = (newWidth: string) => {
        updateAttributes({
            width: newWidth,
            style: `width: ${newWidth}`
        });
    };

    // Ensure style is a valid object
    const safeStyle = (style && typeof style === 'object' && !Array.isArray(style)) ? style : {};

    // Combine width into style explicitly for WYSIWYG
    const imgStyle = {
        ...safeStyle,
        width: width || '100%',
        height: 'auto'
    };

    return (
        <NodeViewWrapper className="image-component relative group flex flex-col items-center my-6">
            <figure className="relative max-w-full group-hover:cursor-default">
                <div className="relative inline-block">
                    <img
                        src={src}
                        alt={alt}
                        style={imgStyle}
                        className={`rounded-lg transition-all ${selected ? 'ring-2 ring-[var(--accent)] shadow-lg' : ''}`}
                    />

                    {selected && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
                            {/* Size Controls */}
                            <div className="flex items-center gap-1 rounded-full bg-[var(--surface-overlay)] border border-[color:var(--border)] p-1 shadow-xl backdrop-blur-sm animate-fade-in">
                                {['25%', '50%', '75%', '100%'].map((w) => (
                                    <button
                                        key={w}
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleResize(w);
                                        }}
                                        className={`rounded-full px-3 py-1 text-[10px] font-bold transition-colors ${(width === w || (!width && w === '100%'))
                                            ? 'bg-[var(--accent)] text-white'
                                            : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
                                            }`}
                                    >
                                        {w}
                                    </button>
                                ))}
                            </div>

                            {/* Set Cover Button */}
                            {onSetCover && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (src && onSetCover) onSetCover(src);
                                    }}
                                    className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${isCover
                                            ? 'bg-[var(--accent)] text-white cursor-default'
                                            : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-muted)] border border-[color:var(--border)]'
                                        }`}
                                    disabled={isCover}
                                >
                                    {isCover ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            대표 이미지
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                            대표 이미지로 설정
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <input
                    type="text"
                    placeholder="이미지 설명 입력..."
                    value={caption || ''}
                    onChange={(e) => updateAttributes({ caption: e.target.value })}
                    className="mt-3 w-full text-center text-sm text-[var(--text-muted)] border-none bg-transparent focus:ring-0 focus:outline-none placeholder:text-[var(--text-muted)]/50"
                    onClick={(e) => e.stopPropagation()}
                />
            </figure>
        </NodeViewWrapper>
    );
};

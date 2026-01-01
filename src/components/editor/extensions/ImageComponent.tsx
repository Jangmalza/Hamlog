import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';


export const ImageComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
    const { src, alt, width, style, caption } = node.attrs;

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
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-[var(--surface-overlay)] border border-[color:var(--border)] p-1 shadow-xl backdrop-blur-sm animate-fade-in z-20">
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

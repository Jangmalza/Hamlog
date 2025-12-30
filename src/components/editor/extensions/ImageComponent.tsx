import { NodeViewWrapper } from '@tiptap/react';


export const ImageComponent = ({ node, updateAttributes, selected }: any) => {
    const { src, alt, size, style, caption } = node.attrs;

    // Ensure style is a valid object before spreading to prevent CSS indexed property error
    const safeStyle = (style && typeof style === 'object' && !Array.isArray(style)) ? style : undefined;

    return (
        <NodeViewWrapper className="image-component relative group flex flex-col items-center my-4">
            <figure className="relative max-w-full">
                <img
                    src={src}
                    alt={alt}
                    style={safeStyle}
                    className={`rounded-lg transition-all ${selected ? 'ring-2 ring-blue-500' : ''}`}
                    data-size={size}
                />
                <input
                    type="text"
                    placeholder="이미지 설명 입력..."
                    value={caption || ''}
                    onChange={(e) => updateAttributes({ caption: e.target.value })}
                    className="mt-2 w-full text-center text-sm text-gray-500 border-none bg-transparent focus:ring-0 focus:outline-none placeholder:text-gray-300"
                />
            </figure>
        </NodeViewWrapper>
    );
};

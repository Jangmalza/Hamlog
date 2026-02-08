import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useEditorAction } from '../../../contexts/EditorActionContext';
import { ImageBubbleMenu } from './ImageBubbleMenu';


export const ImageComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
    const { src, alt, width, style, caption } = node.attrs;

    // Safely consume context - might be null if used outside provider (e.g. preview)
    let onSetCover: ((src: string) => void) | undefined;
    let currentCoverUrl: string | undefined;
    let onToolbarUpload: (() => void) | undefined;
    let uploadLocalImage: ((file: File) => Promise<{ url: string }>) | undefined;

    try {
        const ctx = useEditorAction();
        onSetCover = ctx.onSetCover;
        currentCoverUrl = ctx.currentCoverUrl;
        onToolbarUpload = ctx.onToolbarUpload;
        uploadLocalImage = ctx.uploadLocalImage;
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

    // If no src, Render Placeholder
    if (!src) {
        return (
            <NodeViewWrapper className="image-component relative group flex flex-col items-center my-6">
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDrop={async (e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith('image/') && uploadLocalImage) {
                            try {
                                const { url } = await uploadLocalImage(file);
                                updateAttributes({ src: url });
                            } catch (error) {
                                console.error('Failed to upload dropped image', error);
                                alert('이미지 업로드에 실패했습니다.');
                            }
                        }
                    }}
                    onClick={() => {
                        // Better UX: Focus this node, then trigger upload.
                        if (onToolbarUpload) {
                            onToolbarUpload();
                        }
                    }}
                    className="w-full h-48 bg-[var(--surface-muted)] border-2 border-dashed border-[color:var(--border)] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--surface)] hover:border-[color:var(--accent)] transition-colors gap-2"
                >
                    <span className="text-2xl text-[var(--text-muted)]">+</span>
                    <span className="text-sm font-medium text-[var(--text-muted)]">
                        이미지 추가
                        <span className="block text-xs font-normal opacity-50 mt-1">클릭하거나 파일을 드래그하세요</span>
                    </span>
                </div>
            </NodeViewWrapper>
        )
    }

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
                        <ImageBubbleMenu
                            width={width}
                            src={src}
                            onResize={handleResize}
                            onSetCover={onSetCover}
                            isCover={isCover}
                        />
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

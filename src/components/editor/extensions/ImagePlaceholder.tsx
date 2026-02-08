
import { NodeViewWrapper } from '@tiptap/react';

interface ImagePlaceholderProps {
    onUpload: (file: File) => Promise<void>;
    onToolbarClick?: () => void;
}

export const ImagePlaceholder = ({ onUpload, onToolbarClick }: ImagePlaceholderProps) => {
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
                    if (file && file.type.startsWith('image/')) {
                        await onUpload(file);
                    }
                }}
                onClick={() => {
                    if (onToolbarClick) {
                        onToolbarClick();
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
    );
};

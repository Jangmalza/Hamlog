

import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';

export const ImageGalleryComponent = ({ node, updateAttributes }: any) => {
    const columns = node.attrs.columns || 2;

    const setColumns = (cols: number) => {
        updateAttributes({ columns: cols });
    };

    return (
        <NodeViewWrapper className="image-gallery-wrapper group relative my-4 rounded-lg border border-dashed border-gray-300 p-2 hover:border-blue-500">
            <div className="absolute right-2 top-2 z-10 flex gap-1 rounded bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                    type="button"
                    onClick={() => setColumns(2)}
                    className={`rounded px-2 py-1 text-xs text-white ${columns === 2 ? 'bg-green-500' : 'hover:bg-white/20'}`}
                >
                    2열
                </button>
                <button
                    type="button"
                    onClick={() => setColumns(3)}
                    className={`rounded px-2 py-1 text-xs text-white ${columns === 3 ? 'bg-green-500' : 'hover:bg-white/20'}`}
                >
                    3열
                </button>
            </div>
            <NodeViewContent
                className={`image-gallery grid gap-4 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
            />
        </NodeViewWrapper>
    );
};


import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageGalleryComponent } from './ImageGalleryComponent';

export const ImageGallery = Node.create({
    name: 'imageGallery',

    group: 'block',

    content: 'image+',

    draggable: true,

    addAttributes() {
        return {
            columns: {
                default: 2,
                renderHTML: attributes => ({
                    'data-columns': attributes.columns,
                }),
                parseHTML: element => parseInt(element.getAttribute('data-columns') || '2', 10),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[class="image-gallery"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { class: 'image-gallery' }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ImageGalleryComponent);
    },
});

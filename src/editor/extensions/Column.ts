import { Node, mergeAttributes } from '@tiptap/core';

export const Columns = Node.create({
    name: 'columns',
    group: 'block',
    content: 'column+',
    isolating: true,
    defining: true,

    addAttributes() {
        return {
            layout: {
                default: 'two-column',
                parseHTML: element => element.getAttribute('data-layout'),
                renderHTML: attributes => ({ 'data-layout': attributes.layout }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="columns"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'columns', class: 'flex gap-4 my-4 flex-col sm:flex-row' }), 0];
    },
});

export const Column = Node.create({
    name: 'column',
    content: 'block+',
    isolating: true,
    defining: true,

    parseHTML() {
        return [
            {
                tag: 'div[data-type="column"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column', class: 'flex-1 min-w-0' }), 0];
    },
});

import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core';
import katex from 'katex';

export const MathExtension = Node.create({
    name: 'math',

    group: 'inline math',

    content: 'text*',

    inline: true,

    atom: true,

    addAttributes() {
        return {
            latex: {
                default: 'x',
                parseHTML: element => element.getAttribute('data-latex'),
                renderHTML: attributes => {
                    return {
                        'data-latex': attributes.latex,
                    };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="math"]',
            },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'math' }), ['span', { class: 'math-render' }], ['span', { class: 'math-src' }, node.attrs.latex]];
    },

    addInputRules() {
        return [
            nodeInputRule({
                find: /(?:^|\s)\$(.+?)\$$/,
                type: this.type,
                getAttributes: match => {
                    return {
                        latex: match[1],
                    };
                },
            }),
        ];
    },

    addNodeView() {
        return ({ node }) => {
            const dom = document.createElement('span');
            dom.classList.add('math-node');

            const renderSpan = document.createElement('span');
            renderSpan.classList.add('math-render');

            // Render math
            try {
                katex.render(node.attrs.latex || 'x', renderSpan, {
                    throwOnError: false,
                    output: 'html' // Use HTML mostly
                });
            } catch {
                renderSpan.innerText = 'Error';
            }

            dom.appendChild(renderSpan);

            // Simple click handler to potentiall edit (optional, for now just render)
            // In a real implementation, you might want to show an input on click.
            // For this task, getting rendering working from $..$ is priority.

            return {
                dom,
                selectNode: () => {
                    dom.classList.add('ProseMirror-selectednode');
                },
                deselectNode: () => {
                    dom.classList.remove('ProseMirror-selectednode');
                },
            }
        }
    }
});

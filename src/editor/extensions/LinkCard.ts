import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { LinkCardComponent } from '../../components/editor/extensions/LinkCardComponent';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        linkCard: {
            setLinkCard: (options: {
                url: string;
                title: string;
                description: string;
                image: string;
                domain: string;
            }) => ReturnType;
        };
    }
}

export const LinkCard = Node.create({
    name: 'linkCard',

    group: 'block',
    atom: true, // It's a single unit, content is not editable

    addAttributes() {
        return {
            url: {
                default: '',
            },
            title: {
                default: '',
            },
            description: {
                default: '',
            },
            image: {
                default: '',
            },
            domain: {
                default: '',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'link-card',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['link-card', mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
        // @ts-ignore - Component props matching Tiptap NodeViewProps is tricky with strict types
        return ReactNodeViewRenderer(LinkCardComponent);
    },

    addCommands() {
        return {
            setLinkCard: (options: any) => ({ commands }: any) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
        }
    }
});

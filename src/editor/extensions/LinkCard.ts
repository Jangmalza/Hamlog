import { Node, mergeAttributes } from '@tiptap/core';
import type { CommandProps } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { LinkCardComponent } from '../../components/editor/extensions/LinkCardComponent';

interface LinkCardAttributes {
    url: string;
    title: string;
    description: string;
    image: string;
    domain: string;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        linkCard: {
            setLinkCard: (options: LinkCardAttributes) => ReturnType;
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
        return ReactNodeViewRenderer(
            LinkCardComponent as unknown as Parameters<typeof ReactNodeViewRenderer>[0]
        );
    },

    addCommands() {
        return {
            setLinkCard: (options: LinkCardAttributes) => ({ commands }: Pick<CommandProps, 'commands'>) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
        }
    }
});

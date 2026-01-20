import { useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { createLowlight, common } from 'lowlight';
import { SlashCommand, getSuggestionItems, renderItems } from '../editor/extensions/slashCommand';
import { FontSize } from '../editor/extensions/fontSize';
import { MathExtension } from '../components/editor/extensions/MathExtension';
import { ImageGallery } from '../components/editor/extensions/ImageGallery';
import { ImageComponent } from '../components/editor/extensions/ImageComponent';
import { ReactNodeViewRenderer } from '@tiptap/react';

import Typography from '@tiptap/extension-typography';
import type { PostDraft } from '../types/admin';
import type { EditorView } from '@tiptap/pm/view';
import type { Slice } from '@tiptap/pm/model';

const lowlight = createLowlight(common);

const CustomImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            size: {
                default: 'full',
                parseHTML: element => element.getAttribute('data-size') || 'full',
                renderHTML: attributes => ({
                    'data-size': attributes.size
                })
            },
            dataWidth: {
                default: null,
                parseHTML: element => element.getAttribute('data-width'),
                renderHTML: attributes =>
                    attributes.dataWidth ? { 'data-width': attributes.dataWidth } : {}
            },
            width: {
                default: null,
                parseHTML: element => element.getAttribute('width'),
                renderHTML: attributes =>
                    attributes.width ? { width: attributes.width } : {}
            },
            style: {
                default: null,
                parseHTML: element => element.getAttribute('style'),
                renderHTML: attributes =>
                    attributes.style ? { style: attributes.style } : {}
            },
            caption: {
                default: null,
                parseHTML: element => element.querySelector('figcaption')?.innerText || element.getAttribute('data-caption'),
                renderHTML: attributes => {
                    if (!attributes.caption) return {};
                    return { 'data-caption': attributes.caption };
                }
            }
        };
    },
    renderHTML({ HTMLAttributes }) {
        const { caption } = HTMLAttributes;

        // This is for Tiptap's output (saving to HTML)
        // We render a figure with caption if it exists
        if (caption) {
            return [
                'figure',
                { class: 'post-image local-image' },
                ['img', HTMLAttributes],
                ['figcaption', {}, caption]
            ];
        }
        return ['img', HTMLAttributes];
    },
    addNodeView() {
        return ReactNodeViewRenderer(ImageComponent);
    }
});

interface UseTiptapEditorProps {
    contentHtml: string;
    setDraft: React.Dispatch<React.SetStateAction<PostDraft>>;
    handleSelectionUpdate: (editor: Editor) => void;
    handlePaste: (view: EditorView, event: ClipboardEvent, slice: Slice) => boolean | void;
    handleDrop: (view: EditorView, event: DragEvent, slice: Slice, moved: boolean) => boolean | void;
}

export const useTiptapEditor = ({
    contentHtml,
    setDraft,
    handleSelectionUpdate,
    handlePaste,
    handleDrop
}: UseTiptapEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3]
                },
                codeBlock: false
            }),
            CodeBlockLowlight.configure({ lowlight }),
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            FontFamily,
            FontSize,
            Underline,
            LinkExtension.configure({
                openOnClick: false
            }),
            CustomImage,
            Placeholder.configure({
                placeholder: '내용을 입력하세요...'
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph']
            }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            SlashCommand.configure({
                suggestion: {
                    items: getSuggestionItems,
                    render: renderItems,
                },
            })
            ,
            MathExtension,
            Typography,
            ImageGallery,
            Youtube.configure({
                controls: false,
            })
        ],
        content: contentHtml || '',
        onUpdate: ({ editor }) => {
            setDraft(prev => ({ ...prev, contentHtml: editor.getHTML() }));
        },
        onSelectionUpdate: ({ editor }) => {
            handleSelectionUpdate(editor);
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor border-none shadow-none outline-none ring-0 focus:ring-0 focus:outline-none'
            },
            handlePaste,
            handleDrop
        }
    });

    return editor;
};

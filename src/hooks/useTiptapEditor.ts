import { useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import type { PostDraft } from '../types/admin';
import type { EditorView } from '@tiptap/pm/view';
import type { Slice } from '@tiptap/pm/model';
import { getEditorExtensions } from '../editor/editorConfig';

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
        extensions: getEditorExtensions(),
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

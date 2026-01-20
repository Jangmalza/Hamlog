import React from 'react';
import { BubbleMenu } from '@tiptap/react';
import type { Editor } from '@tiptap/react';

interface TableBubbleMenuProps {
    editor: Editor | null;
}

export const TableBubbleMenu: React.FC<TableBubbleMenuProps> = ({ editor }) => {
    if (!editor) return null;

    return (
        <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100, maxWidth: 600 }}
            shouldShow={({ editor }) => editor.isActive('table')}
            className="flex flex-wrap gap-1 rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-2 shadow-lg"
        >
            {/* Rows */}
            <div className="flex items-center gap-1 border-r border-[color:var(--border)] pr-2">
                <button
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                    className="rounded p-1 text-xs hover:bg-[var(--surface-muted)]"
                    title="위에 행 추가"
                >
                    +Row↑
                </button>
                <button
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    className="rounded p-1 text-xs hover:bg-[var(--surface-muted)]"
                    title="아래에 행 추가"
                >
                    +Row↓
                </button>
                <button
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    className="rounded p-1 text-xs text-red-500 hover:bg-red-50"
                    title="행 삭제"
                >
                    Del Row
                </button>
            </div>

            {/* Columns */}
            <div className="flex items-center gap-1 border-r border-[color:var(--border)] pr-2">
                <button
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                    className="rounded p-1 text-xs hover:bg-[var(--surface-muted)]"
                    title="왼쪽에 열 추가"
                >
                    +Col←
                </button>
                <button
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    className="rounded p-1 text-xs hover:bg-[var(--surface-muted)]"
                    title="오른쪽에 열 추가"
                >
                    +Col→
                </button>
                <button
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    className="rounded p-1 text-xs text-red-500 hover:bg-red-50"
                    title="열 삭제"
                >
                    Del Col
                </button>
            </div>

            {/* Cells */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => editor.chain().focus().mergeCells().run()}
                    className="rounded p-1 text-xs hover:bg-[var(--surface-muted)]"
                    title="셀 병합"
                    disabled={!editor.can().mergeCells()}
                >
                    Merge
                </button>
                <button
                    onClick={() => editor.chain().focus().splitCell().run()}
                    className="rounded p-1 text-xs hover:bg-[var(--surface-muted)]"
                    title="셀 분할"
                    disabled={!editor.can().splitCell()}
                >
                    Split
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeaderCell().run()}
                    className="rounded p-1 text-xs hover:bg-[var(--surface-muted)]"
                    title="헤더 토글"
                >
                    Header
                </button>
                <button
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className="rounded p-1 text-xs font-bold text-red-600 hover:bg-red-50"
                    title="표 삭제"
                >
                    Del Table
                </button>
            </div>
        </BubbleMenu>
    );
};

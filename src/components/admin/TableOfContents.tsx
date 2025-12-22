import { Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';

interface TableOfContentsProps {
    editor: Editor | null;
}

interface TocItem {
    id: string;
    level: number;
    text: string;
    pos: number;
}

export const TableOfContents = ({ editor }: TableOfContentsProps) => {
    const [items, setItems] = useState<TocItem[]>([]);

    useEffect(() => {
        if (!editor) return;

        const updateToc = () => {
            const newItems: TocItem[] = [];
            const doc = editor.state.doc;

            doc.descendants((node, pos) => {
                if (node.type.name === 'heading') {
                    // Generate a stable ID if possible, or just use text/index
                    // Tiptap doesn't auto-generate IDs for headings by default unless using an extension.
                    // For navigation, we can use setSelection/scrollIntoView.

                    newItems.push({
                        id: `toc-${pos}`,
                        level: node.attrs.level,
                        text: node.textContent,
                        pos
                    });
                }
            });

            setItems(newItems);
        };

        updateToc();
        editor.on('update', updateToc);

        return () => {
            editor.off('update', updateToc);
        };
    }, [editor]);

    if (items.length === 0) return null;

    const handleItemClick = (pos: number) => {
        if (!editor) return;
        editor.commands.setTextSelection(pos);
        editor.commands.scrollIntoView();
        // Optional: Focus the editor
        editor.commands.focus();
    };

    return (
        <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                목차
            </h3>
            <ul className="space-y-1">
                {items.map((item, index) => (
                    <li
                        key={item.id + index}
                        style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                    >
                        <button
                            onClick={() => handleItemClick(item.pos)}
                            className="text-left text-sm text-[var(--text-muted)] hover:text-[var(--accent)] hover:underline block w-full truncate transition-colors"
                        >
                            {item.text || '(제목 없음)'}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

import { useCallback, useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { TocItem } from '../components/TableOfContents';

export function useEditorToc(editor: Editor | null) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  useEffect(() => {
    if (!editor) {
      setTocItems([]);
      return;
    }

    const updateToc = () => {
      const items: TocItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          items.push({
            id: `heading-${pos}`,
            text: node.textContent,
            level: node.attrs.level
          });
        }
      });
      setTocItems(items);
    };

    updateToc();
    editor.on('update', updateToc);

    return () => {
      editor.off('update', updateToc);
    };
  }, [editor]);

  const handleTocLinkClick = useCallback(
    (id: string) => {
      const pos = Number.parseInt(id.replace('heading-', ''), 10);
      if (Number.isNaN(pos) || !editor) return;
      editor.commands.focus(pos);
      const element = editor.view.nodeDOM(pos) as HTMLElement | null;
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [editor]
  );

  return {
    tocItems,
    handleTocLinkClick
  };
}

import { Extension } from '@tiptap/core';
import type { Editor, Range } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import type { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import type { Instance } from 'tippy.js';
import { API_BASE_URL } from '../../api/client';
import { promptForText, showEditorToast } from '../../utils/editorDialog';
import {
    SlashCommandList,
    type SlashCommandContext,
    type SlashCommandItem,
    type SlashCommandListHandle,
    type SlashCommandListProps
} from '../../components/editor/SlashCommandList';

type SlashSuggestionOptions = Omit<SuggestionOptions<SlashCommandItem, SlashCommandItem>, 'editor'>;

interface SlashCommandExtensionOptions {
    suggestion: SlashSuggestionOptions;
}

interface SuggestionCommandPayload {
    editor: Editor;
    range: Range;
    props: SlashCommandItem;
}

export const SlashCommand = Extension.create<SlashCommandExtensionOptions>({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: SuggestionCommandPayload) => {
                    props.command({ editor, range });
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion<SlashCommandItem, SlashCommandItem>({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

const createColumnContent = (count: 2 | 3, contentType: 'paragraph' | 'image') => {
    const layout = count === 3 ? 'three-column' : 'two-column';
    const columnContent = contentType === 'image'
        ? { type: 'image', attrs: { src: '' } }
        : { type: 'paragraph' };

    return {
        type: 'columns',
        attrs: { layout },
        content: Array.from({ length: count }, () => ({
            type: 'column',
            content: [columnContent]
        }))
    };
};

const insertFallbackLink = (editor: Editor, url: string) => {
    editor
        .chain()
        .focus()
        .insertContent({
            type: 'text',
            text: url,
            marks: [{ type: 'link', attrs: { href: url } }]
        })
        .run();
};

export const getSuggestionItems = ({ query }: { query: string }) => {
    const items: SlashCommandItem[] = [
        {
            title: '제목 1',
            description: '가장 큰 제목',
            searchTerms: ['h1', 'heading', '제목'],
            icon: 'H1',
            command: ({ editor, range }: SlashCommandContext) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
            },
        },
        {
            title: '제목 2',
            description: '중간 크기 제목',
            searchTerms: ['h2', 'heading', '제목'],
            icon: 'H2',
            command: ({ editor, range }: SlashCommandContext) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
            },
        },
        {
            title: '제목 3',
            description: '작은 제목',
            searchTerms: ['h3', 'heading', '제목'],
            icon: 'H3',
            command: ({ editor, range }: SlashCommandContext) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
            },
        },
        {
            title: '본문',
            description: '일반 텍스트',
            searchTerms: ['p', 'paragraph', '본문'],
            icon: 'T',
            command: ({ editor, range }: SlashCommandContext) => {
                editor.chain().focus().deleteRange(range).setParagraph().run();
            },
        },
        {
            title: '글머리 목록',
            description: '순서 없는 목록',
            searchTerms: ['unordered', 'point', 'list', '목록'],
            icon: '•',
            command: ({ editor, range }: SlashCommandContext) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: '번호 목록',
            description: '순서 있는 목록',
            searchTerms: ['ordered', 'number', 'list', '목록'],
            icon: '1.',
            command: ({ editor, range }: SlashCommandContext) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
            },
        },
        {
            title: '인용구',
            description: '인용문 작성',
            searchTerms: ['quote', 'blockquote', '인용'],
            icon: '“',
            command: ({ editor, range }: SlashCommandContext) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
            },
        },
        {
            title: '코드 블록',
            description: '코드 작성',
            searchTerms: ['code', 'block', '코드'],
            icon: '<>',
            command: ({ editor, range }: SlashCommandContext) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
            },
        },
        {
            title: '구분선',
            description: '수평선 삽입',
            searchTerms: ['line', 'divider', 'rule', '구분선'],
            icon: '—',
            command: ({ editor, range }: SlashCommandContext) => {
                editor.chain().focus().deleteRange(range).setHorizontalRule().run();
            },
        },
        {
            title: '이미지 URL',
            description: 'URL로 이미지 삽입',
            searchTerms: ['image', 'photo', 'picture', '이미지'],
            icon: '🖼',
            command: async ({ editor, range }: SlashCommandContext) => {
                const rawUrl = await promptForText({
                    title: '이미지 URL 입력',
                    placeholder: 'https://'
                });
                const url = rawUrl?.trim();
                if (!url) return;
                editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
            },
        },
        {
            title: '표',
            description: '3x3 표 삽입',
            searchTerms: ['table', 'grid', '표'],
            icon: '▦',
            command: ({ editor, range }: SlashCommandContext) => {
                editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            },
        },
        {
            title: '유튜브',
            description: '유튜브 영상 삽입',
            searchTerms: ['youtube', 'video', '유튜브', '영상'],
            icon: '▶',
            command: async ({ editor, range }: SlashCommandContext) => {
                const rawUrl = await promptForText({
                    title: '유튜브 URL 입력',
                    placeholder: 'https://www.youtube.com/watch?v=...'
                });
                const url = rawUrl?.trim();
                if (!url) return;
                editor.chain().focus().deleteRange(range).setYoutubeVideo({ src: url }).run();
            },
        },
        {
            title: '수식',
            description: 'LaTeX 수식 삽입',
            searchTerms: ['math', 'latex', '수식'],
            icon: '∑',
            command: async ({ editor, range }: SlashCommandContext) => {
                const rawLatex = await promptForText({
                    title: 'LaTeX 수식 입력',
                    defaultValue: 'E = mc^2'
                });
                const latex = rawLatex?.trim();
                if (!latex) return;
                editor.chain().focus().deleteRange(range).insertContent({ type: 'math', attrs: { latex } }).run();
            },
        },
        {
            title: '링크 카드',
            description: 'URL을 카드 형태로 삽입',
            searchTerms: ['link', 'card', 'preview', '링크', '카드'],
            icon: '🔗',
            command: async ({ editor, range }: SlashCommandContext) => {
                const rawUrl = await promptForText({
                    title: '링크 URL 입력',
                    placeholder: 'https://'
                });
                const url = rawUrl?.trim();
                if (!url) return;

                try {
                    editor.chain().focus().deleteRange(range).run();
                    const response = await fetch(
                        `${API_BASE_URL}/preview?url=${encodeURIComponent(url)}`,
                        { credentials: 'include' }
                    );
                    if (!response.ok) throw new Error(`Failed to fetch preview (${response.status})`);

                    const data = await response.json();
                    editor.chain().focus().setLinkCard(data).run();
                } catch (error) {
                    console.error(error);
                    showEditorToast('링크 정보를 불러오지 못해 일반 링크로 삽입했습니다.', 'error');
                    insertFallbackLink(editor, url);
                }
            },
        },
        {
            title: '2단 레이아웃',
            description: '화면을 2개로 분할',
            searchTerms: ['2', 'column', 'layout', '분할'],
            icon: '◫',
            command: ({ editor, range }: SlashCommandContext) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertContent(createColumnContent(2, 'paragraph'))
                    .run();
            },
        },
        {
            title: '3단 레이아웃',
            description: '화면을 3개로 분할',
            searchTerms: ['3', 'column', 'layout', '분할'],
            icon: '▥',
            command: ({ editor, range }: SlashCommandContext) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertContent(createColumnContent(3, 'paragraph'))
                    .run();
            },
        },
        {
            title: '2단 이미지',
            description: '이미지 2개를 나란히 배치',
            searchTerms: ['2', 'photo', 'image', 'picture', '이미지', '사진'],
            icon: '🖼',
            command: ({ editor, range }: SlashCommandContext) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertContent(createColumnContent(2, 'image'))
                    .run();
            },
        },
        {
            title: '3단 이미지',
            description: '이미지 3개를 나란히 배치',
            searchTerms: ['3', 'photo', 'image', 'picture', '이미지', '사진'],
            icon: '🖼',
            command: ({ editor, range }: SlashCommandContext) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertContent(createColumnContent(3, 'image'))
                    .run();
            },
        },
    ];

    return items.filter((item) => {
        if (!query) return true;
        const search = query.toLowerCase();
        return (
            item.title.toLowerCase().includes(search)
            || item.description?.toLowerCase().includes(search)
            || item.searchTerms?.some(term => term.includes(search))
        );
    });
};

export const renderItems = () => {
    let component: ReactRenderer<SlashCommandListHandle, SlashCommandListProps> | null = null;
    let popup: Instance[] | null = null;

    return {
        onStart: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => {
            component = new ReactRenderer<SlashCommandListHandle, SlashCommandListProps>(SlashCommandList, {
                props,
                editor: props.editor,
            });

            if (!props.clientRect) {
                return;
            }

            const getReferenceClientRect = () => props.clientRect?.() ?? new DOMRect();

            popup = tippy('body', {
                getReferenceClientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
            });
        },

        onUpdate: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => {
            component?.updateProps(props);

            if (!props.clientRect) {
                return;
            }

            const getReferenceClientRect = () => props.clientRect?.() ?? new DOMRect();

            popup?.[0]?.setProps({
                getReferenceClientRect,
            });
        },

        onKeyDown: (props: SuggestionKeyDownProps) => {
            if (props.event.key === 'Escape') {
                popup?.[0]?.hide();
                return true;
            }

            return component?.ref?.onKeyDown(props) ?? false;
        },

        onExit: () => {
            popup?.[0]?.destroy();
            component?.destroy();
            popup = null;
            component = null;
        },
    };
};

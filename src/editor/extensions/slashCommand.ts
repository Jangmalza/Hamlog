import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { SlashCommandList } from '../../components/editor/SlashCommandList';

export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

export const getSuggestionItems = ({ query }: { query: string }) => {
    return [
        {
            title: '제목 1',
            description: '가장 큰 제목',
            searchTerms: ['h1', 'heading', '제목'],
            icon: 'H1',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
            },
        },
        {
            title: '제목 2',
            description: '중간 크기 제목',
            searchTerms: ['h2', 'heading', '제목'],
            icon: 'H2',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
            },
        },
        {
            title: '제목 3',
            description: '작은 제목',
            searchTerms: ['h3', 'heading', '제목'],
            icon: 'H3',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
            },
        },
        {
            title: '본문',
            description: '일반 텍스트',
            searchTerms: ['p', 'paragraph', '본문'],
            icon: 'T',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setParagraph().run();
            },
        },
        {
            title: '글머리 목록',
            description: '순서 없는 목록',
            searchTerms: ['unordered', 'point', 'list', '목록'],
            icon: '•',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: '번호 목록',
            description: '순서 있는 목록',
            searchTerms: ['ordered', 'number', 'list', '목록'],
            icon: '1.',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
            },
        },
        {
            title: '인용구',
            description: '인용문 작성',
            searchTerms: ['quote', 'blockquote', '인용'],
            icon: '“',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
            },
        },
        {
            title: '코드 블록',
            description: '코드 작성',
            searchTerms: ['code', 'block', '코드'],
            icon: '<>',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
            },
        },
        {
            title: '구분선',
            description: '수평선 삽입',
            searchTerms: ['line', 'divider', 'rule', '구분선'],
            icon: '—',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setHorizontalRule().run();
            },
        },
        {
            title: '이미지 URL',
            description: 'URL로 이미지 삽입',
            searchTerms: ['image', 'photo', 'picture', '이미지'],
            icon: '🖼',
            command: ({ editor, range }: any) => {
                const url = window.prompt('이미지 URL을 입력하세요:');
                if (url) {
                    editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
                }
            },
        },
        // Table
        {
            title: '표',
            description: '3x3 표 삽입',
            searchTerms: ['table', 'grid', '표'],
            icon: '▦',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            },
        },
        // YouTube
        {
            title: '유튜브',
            description: '유튜브 영상 삽입',
            searchTerms: ['youtube', 'video', '유튜브', '영상'],
            icon: '▶',
            command: ({ editor, range }: any) => {
                const url = window.prompt('유튜브 주소를 입력하세요:');
                if (url) {
                    editor.chain().focus().deleteRange(range).setYoutubeVideo({ src: url }).run();
                }
            },
        },
        // Math
        {
            title: '수식',
            description: 'LaTeX 수식 삽입',
            searchTerms: ['math', 'latex', '수식'],
            icon: '∑',
            command: ({ editor, range }: any) => {
                const latex = window.prompt('LaTeX 수식을 입력하세요:', 'E = mc^2');
                if (latex) {
                    editor.chain().focus().deleteRange(range).insertContent({ type: 'math', attrs: { latex } }).run();
                }
            },
        },
    ].filter((item) => {
        if (typeof query === 'string' && query.length > 0) {
            const search = query.toLowerCase();
            return (
                item.title.toLowerCase().includes(search) ||
                item.description.toLowerCase().includes(search) ||
                (item.searchTerms && item.searchTerms.some((term: string) => term.includes(search)))
            );
        }
        return true;
    });
};

export const renderItems = () => {
    let component: ReactRenderer | null = null;
    let popup: any | null = null;

    return {
        onStart: (props: any) => {
            component = new ReactRenderer(SlashCommandList, {
                props,
                editor: props.editor,
            });

            if (!props.clientRect) {
                return;
            }

            popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
            });
        },

        onUpdate: (props: any) => {
            component?.updateProps(props);

            if (!props.clientRect) {
                return;
            }

            popup?.[0].setProps({
                getReferenceClientRect: props.clientRect,
            });
        },

        onKeyDown: (props: any) => {
            if (props.event.key === 'Escape') {
                popup?.[0].hide();
                return true;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (component?.ref as any)?.onKeyDown(props);
        },

        onExit: () => {
            popup?.[0].destroy();
            component?.destroy();
        },
    };
};

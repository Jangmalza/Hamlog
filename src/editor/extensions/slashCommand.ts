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
        // Link Card
        {
            title: '링크 카드',
            description: 'URL을 카드 형태로 삽입',
            searchTerms: ['link', 'card', 'preview', '링크', '카드'],
            icon: '🔗',
            command: async ({ editor, range }: any) => {
                const url = window.prompt('URL을 입력하세요:');
                if (url) {
                    try {
                        // Optimistic UI or Loading state could be added here
                        // For now we just fetch and insert
                        editor.chain().focus().deleteRange(range).run(); // Clear slash command

                        // We need to fetch from our backend
                        // Assuming the frontend is running on same origin or proxies correctly
                        const response = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
                        if (!response.ok) throw new Error('Failed to fetch preview');

                        const data = await response.json();

                        editor.chain().focus().setLinkCard(data).run();
                    } catch (error) {
                        console.error(error);
                        alert('링크 정보를 불러오는데 실패했습니다.');
                        // Fallback to simple link?
                        editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
                    }
                }
            },
        },
        // Columns
        {
            title: '2단 레이아웃',
            description: '화면을 2개로 분할',
            searchTerms: ['2', 'column', 'layout', '분할'],
            icon: '◫',
            command: ({ editor, range }: any) => {
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
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertContent(createColumnContent(3, 'paragraph'))
                    .run();
            },
        },

        // 2 Photos (Image Columns)
        {
            title: '2단 이미지',
            description: '이미지 2개를 나란히 배치',
            searchTerms: ['2', 'photo', 'image', 'picture', '이미지', '사진'],
            icon: '🖼',
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertContent(createColumnContent(2, 'image'))
                    .run();
            },
        },

        // 3 Photos (Image Columns)
        {
            title: '3단 이미지',
            description: '이미지 3개를 나란히 배치',
            searchTerms: ['3', 'photo', 'image', 'picture', '이미지', '사진'],
            icon: '🖼',
            command: ({ editor, range }: any) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertContent(createColumnContent(3, 'image'))
                    .run();
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

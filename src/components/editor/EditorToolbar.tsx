import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
    CODE_LANGUAGES,
    FONT_FAMILIES,
    FONT_SIZES,
    TEXT_COLORS,
    HIGHLIGHT_COLORS
} from '../../utils/editorConstants';

interface ToolbarButtonProps {
    label: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children?: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
    label,
    onClick,
    active,
    disabled,
    children
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={label}
        aria-label={label}
        className={`inline-flex items-center justify-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition ${active
            ? 'border-[color:var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
            : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
            } disabled:cursor-not-allowed disabled:opacity-60`}
    >
        {children ?? label}
    </button>
);

const ToolbarGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex flex-wrap items-center gap-1">{children}</div>
);



interface EditorToolbarProps {
    editor: Editor | null;
    previewMode: boolean;
    setPreviewMode: (value: boolean) => void;
    onLink: () => void;
    onToolbarImageUpload: () => void;
    onInsertImageUrl: () => void;
    uploadingImage: boolean;
    onSave: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    editor,
    previewMode,
    setPreviewMode,
    onLink,
    onToolbarImageUpload,
    onInsertImageUrl,
    uploadingImage,
    onSave
}) => {
    const [toolbarMenu, setToolbarMenu] = useState<
        'color' | 'highlight' | 'table' | null
    >(null);

    const headingValue = editor?.isActive('heading', { level: 1 })
        ? 'h1'
        : editor?.isActive('heading', { level: 2 })
            ? 'h2'
            : editor?.isActive('heading', { level: 3 })
                ? 'h3'
                : 'paragraph';

    const codeBlockLanguage =
        (editor?.getAttributes('codeBlock') as { language?: string })?.language ??
        'plaintext';

    const isCodeBlockActive = editor?.isActive('codeBlock') ?? false;
    const isTableActive = editor?.isActive('table') ?? false;

    const fontFamilyValue =
        (editor?.getAttributes('textStyle') as { fontFamily?: string })?.fontFamily ??
        'default';
    const fontSizeValue =
        (editor?.getAttributes('textStyle') as { fontSize?: string })?.fontSize ?? 'default';

    const activeColor =
        (editor?.getAttributes('textStyle') as { color?: string })?.color ?? '';
    const activeHighlight =
        (editor?.getAttributes('highlight') as { color?: string })?.color ?? '';

    const resolvedFontFamily = FONT_FAMILIES.some(item => item.value === fontFamilyValue)
        ? fontFamilyValue
        : 'default';
    const resolvedFontSize = FONT_SIZES.some(item => item.value === fontSizeValue)
        ? fontSizeValue
        : 'default';

    const toggleToolbarMenu = (menu: 'color' | 'highlight' | 'table') => {
        setToolbarMenu(prev => (prev === menu ? null : menu));
    };

    const closeToolbarMenu = () => {
        setToolbarMenu(null);
    };

    return (
        <div className="sticky top-0 z-10 mt-6 -mx-6 border-y border-[color:var(--border)] bg-[var(--surface)] px-6 py-2">
            <div className="flex flex-wrap items-center gap-2">
                <ToolbarGroup>
                    <select
                        value={headingValue}
                        onChange={(event) => {
                            const value = event.target.value;
                            if (!editor) return;
                            if (value === 'paragraph') {
                                editor.chain().focus().setParagraph().run();
                                return;
                            }
                            const level = Number(value.replace('h', '')) as 1 | 2 | 3;
                            editor.chain().focus().toggleHeading({ level }).run();
                        }}
                        className="rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text)]"
                    >
                        <option value="paragraph">본문</option>
                        <option value="h1">제목 1</option>
                        <option value="h2">제목 2</option>
                        <option value="h3">제목 3</option>
                    </select>
                    <select
                        value={resolvedFontFamily}
                        onChange={(event) => {
                            if (!editor) return;
                            const value = event.target.value;
                            if (value === 'default') {
                                editor.chain().focus().unsetFontFamily().run();
                                return;
                            }
                            editor.chain().focus().setFontFamily(value).run();
                        }}
                        className="rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text)]"
                    >
                        {FONT_FAMILIES.map(font => (
                            <option key={font.value} value={font.value}>
                                {font.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={resolvedFontSize}
                        onChange={(event) => {
                            if (!editor) return;
                            const value = event.target.value;
                            if (value === 'default') {
                                editor.chain().focus().unsetFontSize().run();
                                return;
                            }
                            editor.chain().focus().setFontSize(value).run();
                        }}
                        className="rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text)]"
                    >
                        {FONT_SIZES.map(size => (
                            <option key={size.value} value={size.value}>
                                {size.label}
                            </option>
                        ))}
                    </select>
                </ToolbarGroup>

                <div className="h-5 w-px bg-[var(--border)]" />

                <ToolbarGroup>
                    <ToolbarButton
                        label="굵게"
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        active={editor?.isActive('bold')}
                        disabled={!editor}
                    >
                        <span className="font-bold">B</span>
                    </ToolbarButton>
                    <ToolbarButton
                        label="기울임"
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        active={editor?.isActive('italic')}
                        disabled={!editor}
                    >
                        <span className="italic">I</span>
                    </ToolbarButton>
                    <ToolbarButton
                        label="밑줄"
                        onClick={() => editor?.chain().focus().toggleUnderline().run()}
                        active={editor?.isActive('underline')}
                        disabled={!editor}
                    >
                        <span className="underline">U</span>
                    </ToolbarButton>
                    <ToolbarButton
                        label="취소선"
                        onClick={() => editor?.chain().focus().toggleStrike().run()}
                        active={editor?.isActive('strike')}
                        disabled={!editor}
                    >
                        <span className="line-through">S</span>
                    </ToolbarButton>
                    <ToolbarButton
                        label="인라인 코드"
                        onClick={() => editor?.chain().focus().toggleCode().run()}
                        active={editor?.isActive('code')}
                        disabled={!editor}
                    >
                        {'</>'}
                    </ToolbarButton>
                    <div className="relative">
                        <ToolbarButton
                            label="글자색"
                            onClick={() => toggleToolbarMenu('color')}
                            active={Boolean(activeColor)}
                            disabled={!editor}
                        >
                            <span className="text-xs font-semibold">A</span>
                            <span
                                className="h-1 w-3 rounded-full"
                                style={{ backgroundColor: activeColor || '#1d1916' }}
                            />
                        </ToolbarButton>
                        {toolbarMenu === 'color' && (
                            <div className="absolute left-0 z-20 mt-2 w-40 rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow)]">
                                <div className="grid grid-cols-7 gap-2">
                                    {TEXT_COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => {
                                                editor?.chain().focus().setColor(color).run();
                                                closeToolbarMenu();
                                            }}
                                            className="h-5 w-5 rounded-full border border-[color:var(--border)]"
                                            style={{ backgroundColor: color }}
                                            aria-label={`색상 ${color}`}
                                        />
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        editor?.chain().focus().unsetColor().run();
                                        closeToolbarMenu();
                                    }}
                                    className="mt-3 w-full rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] font-semibold text-[var(--text-muted)]"
                                >
                                    기본색
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <ToolbarButton
                            label="하이라이트"
                            onClick={() => toggleToolbarMenu('highlight')}
                            active={Boolean(activeHighlight)}
                            disabled={!editor}
                        >
                            <span className="text-xs font-semibold">형광</span>
                        </ToolbarButton>
                        {toolbarMenu === 'highlight' && (
                            <div className="absolute left-0 z-20 mt-2 w-40 rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow)]">
                                <div className="grid grid-cols-6 gap-2">
                                    {HIGHLIGHT_COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => {
                                                editor?.chain().focus().toggleHighlight({ color }).run();
                                                closeToolbarMenu();
                                            }}
                                            className="h-5 w-5 rounded-full border border-[color:var(--border)]"
                                            style={{ backgroundColor: color }}
                                            aria-label={`하이라이트 ${color}`}
                                        />
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        editor?.chain().focus().unsetHighlight().run();
                                        closeToolbarMenu();
                                    }}
                                    className="mt-3 w-full rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] font-semibold text-[var(--text-muted)]"
                                >
                                    제거
                                </button>
                            </div>
                        )}
                    </div>
                    <ToolbarButton
                        label="서식 초기화"
                        onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
                        disabled={!editor}
                    >
                        Tx
                    </ToolbarButton>
                </ToolbarGroup>

                <div className="h-5 w-px bg-[var(--border)]" />

                <ToolbarGroup>
                    <ToolbarButton
                        label="글머리 목록"
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        active={editor?.isActive('bulletList')}
                        disabled={!editor}
                    >
                        •
                    </ToolbarButton>
                    <ToolbarButton
                        label="번호 목록"
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        active={editor?.isActive('orderedList')}
                        disabled={!editor}
                    >
                        1.
                    </ToolbarButton>
                    <ToolbarButton
                        label="왼쪽 정렬"
                        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                        active={editor?.isActive({ textAlign: 'left' })}
                        disabled={!editor}
                    >
                        좌
                    </ToolbarButton>
                    <ToolbarButton
                        label="가운데 정렬"
                        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                        active={editor?.isActive({ textAlign: 'center' })}
                        disabled={!editor}
                    >
                        중
                    </ToolbarButton>
                    <ToolbarButton
                        label="오른쪽 정렬"
                        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                        active={editor?.isActive({ textAlign: 'right' })}
                        disabled={!editor}
                    >
                        우
                    </ToolbarButton>
                    <ToolbarButton
                        label="양쪽 정렬"
                        onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                        active={editor?.isActive({ textAlign: 'justify' })}
                        disabled={!editor}
                    >
                        양
                    </ToolbarButton>
                    <ToolbarButton
                        label="인용"
                        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                        active={editor?.isActive('blockquote')}
                        disabled={!editor}
                    >
                        “”
                    </ToolbarButton>
                    <ToolbarButton
                        label="코드 블록"
                        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                        active={editor?.isActive('codeBlock')}
                        disabled={!editor}
                    >
                        {'</>'}
                    </ToolbarButton>
                    {isCodeBlockActive && (
                        <label className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                            언어
                            <select
                                value={codeBlockLanguage}
                                onChange={(event) => {
                                    if (!editor) return;
                                    editor
                                        .chain()
                                        .focus()
                                        .setCodeBlock({ language: event.target.value })
                                        .run();
                                }}
                                className="rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text)]"
                            >
                                {CODE_LANGUAGES.map(language => (
                                    <option key={language.value} value={language.value}>
                                        {language.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    <ToolbarButton
                        label="구분선"
                        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                        disabled={!editor}
                    >
                        —
                    </ToolbarButton>
                </ToolbarGroup>

                <div className="h-5 w-px bg-[var(--border)]" />

                <ToolbarGroup>
                    <div className="relative">
                        <ToolbarButton
                            label="표"
                            onClick={() => toggleToolbarMenu('table')}
                            active={isTableActive}
                            disabled={!editor}
                        >
                            ▦
                        </ToolbarButton>
                        {toolbarMenu === 'table' && (
                            <div className="absolute left-0 z-20 mt-2 w-52 rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-3 text-xs shadow-[var(--shadow)]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        editor
                                            ?.chain()
                                            .focus()
                                            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                                            .run();
                                        closeToolbarMenu();
                                    }}
                                    className="w-full rounded-full border border-[color:var(--border)] px-3 py-2 text-left text-[11px] font-semibold text-[var(--text)]"
                                >
                                    표 삽입 (3x3)
                                </button>
                                {isTableActive && (
                                    <div className="mt-3 grid gap-2">
                                        <button
                                            type="button"
                                            onClick={() => editor?.chain().focus().addRowAfter().run()}
                                            className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] text-[var(--text-muted)]"
                                        >
                                            아래 행 추가
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => editor?.chain().focus().addColumnAfter().run()}
                                            className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] text-[var(--text-muted)]"
                                        >
                                            오른쪽 열 추가
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => editor?.chain().focus().deleteRow().run()}
                                            className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] text-[var(--text-muted)]"
                                        >
                                            행 삭제
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => editor?.chain().focus().deleteColumn().run()}
                                            className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] text-[var(--text-muted)]"
                                        >
                                            열 삭제
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                editor?.chain().focus().deleteTable().run();
                                                closeToolbarMenu();
                                            }}
                                            className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] text-[var(--text-muted)]"
                                        >
                                            표 삭제
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </ToolbarGroup>

                <div className="h-5 w-px bg-[var(--border)]" />

                <ToolbarGroup>
                    <ToolbarButton
                        label="링크"
                        onClick={onLink}
                        active={editor?.isActive('link')}
                        disabled={!editor}
                    >
                        ↗
                    </ToolbarButton>
                    <ToolbarButton
                        label={uploadingImage ? '업로드...' : '이미지'}
                        onClick={onToolbarImageUpload}
                        disabled={!editor || uploadingImage}
                    >
                        🖼
                    </ToolbarButton>
                    <ToolbarButton
                        label="이미지 URL"
                        onClick={onInsertImageUrl}
                        disabled={!editor}
                    >
                        🔗
                    </ToolbarButton>

                </ToolbarGroup>

                <div className="h-5 w-px bg-[var(--border)]" />

                <ToolbarGroup>
                    <ToolbarButton
                        label="되돌리기"
                        onClick={() => editor?.chain().focus().undo().run()}
                        disabled={!editor}
                    >
                        ↺
                    </ToolbarButton>
                    <ToolbarButton
                        label="다시"
                        onClick={() => editor?.chain().focus().redo().run()}
                        disabled={!editor}
                    >
                        ↻
                    </ToolbarButton>
                </ToolbarGroup>

                <div className="ml-auto flex items-center gap-1">
                    <ToolbarButton
                        label="저장 (Ctrl+S)"
                        onClick={onSave}
                        disabled={!editor}
                    >
                        💾
                    </ToolbarButton>
                    <div className="h-5 w-px bg-[var(--border)] mx-1" />
                    <ToolbarButton
                        label="편집 모드"
                        onClick={() => setPreviewMode(false)}
                        active={!previewMode}
                        disabled={!editor}
                    >
                        ✎
                    </ToolbarButton>
                    <ToolbarButton
                        label="미리보기"
                        onClick={() => setPreviewMode(true)}
                        active={previewMode}
                        disabled={!editor}
                    >
                        👁
                    </ToolbarButton>
                </div>
            </div>
        </div>
    );
};

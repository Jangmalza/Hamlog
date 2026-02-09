import React, { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import {
    Bold, Italic, Underline, Strikethrough, Code, Highlighter,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Quote, Code2, Minus,
    Link as LinkIcon, Image as ImageIcon, Table as TableIcon,
    Undo, Redo, Save, Eye, Edit2, ChevronDown, Check,
    Palette, Ban
} from 'lucide-react';
import {
    CODE_LANGUAGES,
    FONT_FAMILIES,
    FONT_SIZES,
    TEXT_COLORS,
    HIGHLIGHT_COLORS
} from '../../utils/editorConstants';

// --- Sub Components ---

interface ToolbarButtonProps {
    label: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
    label,
    onClick,
    active,
    disabled,
    icon,
    children,
    className
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={label}
        className={`inline-flex items-center justify-center rounded-lg border p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${active
            ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
            : 'border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
            } ${className || ''}`}
    >
        {icon}
        {children}
    </button>
);

interface ToolbarDropdownProps {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onSelect: (value: string) => void;
    width?: string;
    disabled?: boolean;
}

const ToolbarDropdown: React.FC<ToolbarDropdownProps> = ({
    label,
    value,
    options,
    onSelect,
    width = 'w-32',
    disabled
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLabel = options.find(opt => opt.value === value)?.label || label;

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center justify-between gap-2 rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-muted)] disabled:opacity-50 ${width}`}
            >
                <span className="truncate">{currentLabel}</span>
                <ChevronDown size={14} className="opacity-50" />
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-1 shadow-lg ring-1 ring-black/5 w-full min-w-[140px]">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onSelect(option.value);
                                setIsOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-[var(--surface-muted)] ${value === option.value ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)] font-semibold' : 'text-[var(--text)]'
                                }`}
                        >
                            {option.label}
                            {value === option.value && <Check size={12} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Main Toolbar ---

interface EditorToolbarProps {
    editor: Editor | null;
    previewMode: boolean;
    setPreviewMode: (value: boolean) => void;
    onLink: () => void;
    onToolbarImageUpload: () => void;
    onInsertImageUrl: () => void;
    uploadingImage: boolean;
    onSave: () => void;
    onPublish: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    editor,
    previewMode,
    setPreviewMode,
    onLink,
    onToolbarImageUpload,
    onInsertImageUrl,
    uploadingImage,
    onSave,
    onPublish
}) => {
    const [toolbarMenu, setToolbarMenu] = useState<'color' | 'highlight' | 'table' | null>(null);

    // -- Derived States --
    const headingValue = editor?.isActive('heading', { level: 1 })
        ? 'h1'
        : editor?.isActive('heading', { level: 2 })
            ? 'h2'
            : editor?.isActive('heading', { level: 3 })
                ? 'h3'
                : 'paragraph';

    const codeBlockLanguage = (editor?.getAttributes('codeBlock') as { language?: string })?.language ?? 'plaintext';
    const isCodeBlockActive = editor?.isActive('codeBlock') ?? false;

    const fontFamilyValue = (editor?.getAttributes('textStyle') as { fontFamily?: string })?.fontFamily ?? 'default';
    const fontSizeValue = (editor?.getAttributes('textStyle') as { fontSize?: string })?.fontSize ?? 'default';

    const activeColor = (editor?.getAttributes('textStyle') as { color?: string })?.color ?? '';
    const activeHighlight = (editor?.getAttributes('highlight') as { color?: string })?.color ?? '';

    // -- Handlers --
    const toggleToolbarMenu = (menu: 'color' | 'highlight' | 'table') => {
        setToolbarMenu(prev => (prev === menu ? null : menu));
    };

    const closeToolbarMenu = () => setToolbarMenu(null);

    const Divider = () => <div className="mx-1 h-5 w-px bg-[var(--border)]" />;

    return (
        <div className="sticky top-0 z-10 mt-6 -mx-6 border-y border-[color:var(--border)] bg-[var(--surface)] px-4 py-2">
            <div className="flex flex-wrap items-center gap-1">

                {/* --- History --- */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton
                        label="실행 취소"
                        onClick={() => editor?.chain().focus().undo().run()}
                        disabled={!editor}
                        icon={<Undo size={16} />}
                    />
                    <ToolbarButton
                        label="다시 실행"
                        onClick={() => editor?.chain().focus().redo().run()}
                        disabled={!editor}
                        icon={<Redo size={16} />}
                    />
                </div>

                <Divider />

                {/* --- Typography --- */}
                <div className="flex items-center gap-2">
                    <ToolbarDropdown
                        label="본문"
                        value={headingValue}
                        width="w-24"
                        options={[
                            { value: 'paragraph', label: '본문' },
                            { value: 'h1', label: '제목 1' },
                            { value: 'h2', label: '제목 2' },
                            { value: 'h3', label: '제목 3' },
                        ]}
                        onSelect={(val) => {
                            if (!editor) return;
                            if (val === 'paragraph') editor.chain().focus().setParagraph().run();
                            else editor.chain().focus().toggleHeading({ level: Number(val.replace('h', '')) as 1 | 2 | 3 }).run();
                        }}
                        disabled={!editor}
                    />

                    <ToolbarDropdown
                        label="글꼴"
                        value={fontFamilyValue}
                        width="w-28"
                        options={FONT_FAMILIES}
                        onSelect={(val) => {
                            if (!editor) return;
                            if (val === 'default') editor.chain().focus().unsetFontFamily().run();
                            else editor.chain().focus().setFontFamily(val).run();
                        }}
                        disabled={!editor}
                    />

                    <ToolbarDropdown
                        label="크기"
                        value={fontSizeValue}
                        width="w-20"
                        options={FONT_SIZES}
                        onSelect={(val) => {
                            if (!editor) return;
                            if (val === 'default') editor.chain().focus().unsetFontSize().run();
                            else editor.chain().focus().setFontSize(val).run();
                        }}
                        disabled={!editor}
                    />
                </div>

                <Divider />

                {/* --- Formatting --- */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton label="굵게" onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} disabled={!editor} icon={<Bold size={16} />} />
                    <ToolbarButton label="기울임" onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} disabled={!editor} icon={<Italic size={16} />} />
                    <ToolbarButton label="밑줄" onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} disabled={!editor} icon={<Underline size={16} />} />
                    <ToolbarButton label="취소선" onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive('strike')} disabled={!editor} icon={<Strikethrough size={16} />} />
                    <ToolbarButton label="인라인 코드" onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive('code')} disabled={!editor} icon={<Code size={16} />} />

                    {/* Text Color */}
                    <div className="relative">
                        <ToolbarButton label="글자색" onClick={() => toggleToolbarMenu('color')} active={Boolean(activeColor)} disabled={!editor} icon={<Palette size={16} />} className={activeColor ? 'text-[var(--accent-strong)]' : ''}>
                            <div className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: activeColor || 'transparent' }} />
                        </ToolbarButton>
                        {toolbarMenu === 'color' && (
                            <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-2 shadow-lg">
                                <div className="grid grid-cols-5 gap-1">
                                    {TEXT_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => { editor?.chain().focus().setColor(color).run(); closeToolbarMenu(); }}
                                            className="h-6 w-6 rounded-full border border-[color:var(--border)] hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                    <button
                                        onClick={() => { editor?.chain().focus().unsetColor().run(); closeToolbarMenu(); }}
                                        className="flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--border)] bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        title="색상 제거"
                                    >
                                        <Ban size={12} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Highlight */}
                    <div className="relative">
                        <ToolbarButton label="하이라이트" onClick={() => toggleToolbarMenu('highlight')} active={Boolean(activeHighlight)} disabled={!editor} icon={<Highlighter size={16} />} className={activeHighlight ? 'bg-yellow-100 text-yellow-800' : ''} />
                        {toolbarMenu === 'highlight' && (
                            <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-2 shadow-lg">
                                <div className="grid grid-cols-5 gap-1">
                                    {HIGHLIGHT_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => { editor?.chain().focus().toggleHighlight({ color }).run(); closeToolbarMenu(); }}
                                            className="h-6 w-6 rounded-full border border-[color:var(--border)] hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                    <button
                                        onClick={() => { editor?.chain().focus().unsetHighlight().run(); closeToolbarMenu(); }}
                                        className="flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--border)] bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        title="형광펜 제거"
                                    >
                                        <Ban size={12} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <Divider />

                {/* --- Alignment --- */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton label="왼쪽" onClick={() => editor?.chain().focus().setTextAlign('left').run()} active={editor?.isActive({ textAlign: 'left' })} disabled={!editor} icon={<AlignLeft size={16} />} />
                    <ToolbarButton label="가운데" onClick={() => editor?.chain().focus().setTextAlign('center').run()} active={editor?.isActive({ textAlign: 'center' })} disabled={!editor} icon={<AlignCenter size={16} />} />
                    <ToolbarButton label="오른쪽" onClick={() => editor?.chain().focus().setTextAlign('right').run()} active={editor?.isActive({ textAlign: 'right' })} disabled={!editor} icon={<AlignRight size={16} />} />
                    <ToolbarButton label="양쪽" onClick={() => editor?.chain().focus().setTextAlign('justify').run()} active={editor?.isActive({ textAlign: 'justify' })} disabled={!editor} icon={<AlignJustify size={16} />} />
                </div>

                <Divider />

                {/* --- Lists --- */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton label="글머리" onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} disabled={!editor} icon={<List size={16} />} />
                    <ToolbarButton label="번호" onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} disabled={!editor} icon={<ListOrdered size={16} />} />
                    <ToolbarButton label="인용구" onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} disabled={!editor} icon={<Quote size={16} />} />
                </div>

                <Divider />

                {/* --- Insert --- */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton label="코드 블록" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive('codeBlock')} disabled={!editor} icon={<Code2 size={16} />} />
                    <ToolbarButton label="구분선" onClick={() => editor?.chain().focus().setHorizontalRule().run()} disabled={!editor} icon={<Minus size={16} />} />

                    <div className="relative">
                        <ToolbarButton label="표" onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} disabled={!editor} icon={<TableIcon size={16} />} />
                    </div>

                    <ToolbarButton label="링크" onClick={onLink} active={editor?.isActive('link')} disabled={!editor} icon={<LinkIcon size={16} />} />
                    <ToolbarButton label="이미지 업로드" onClick={onToolbarImageUpload} disabled={!editor || uploadingImage} icon={<ImageIcon size={16} />} className={uploadingImage ? 'animate-pulse' : ''} />
                    <ToolbarButton label="이미지 URL" onClick={onInsertImageUrl} disabled={!editor} icon={<LinkIcon size={14} />} ><span className="text-[10px] ml-0.5">URL</span></ToolbarButton>
                </div>

                {/* --- Right Side Actions --- */}
                <div className="ml-auto flex items-center gap-2">
                    <button
                        onClick={onSave}
                        className="flex items-center gap-1.5 rounded-full bg-[var(--text)] px-4 py-1.5 text-xs font-semibold text-[var(--bg)] shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                        title="저장 (Ctrl+S), 초안 저장 (Ctrl+Shift+S)"
                    >
                        <Save size={14} />
                        저장
                    </button>
                    <button
                        onClick={onPublish}
                        className="rounded-full border border-[color:var(--accent)] bg-[var(--accent-soft)] px-4 py-1.5 text-xs font-semibold text-[var(--accent-strong)] transition-colors hover:bg-[var(--accent)] hover:text-white"
                        title="발행 (Ctrl+Enter)"
                    >
                        발행
                    </button>

                    <div className="h-5 w-px bg-[var(--border)]" />

                    <div className="flex rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] p-0.5">
                        <button
                            onClick={() => setPreviewMode(false)}
                            className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-all ${!previewMode ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                                }`}
                        >
                            <Edit2 size={12} />
                            편집
                        </button>
                        <button
                            onClick={() => setPreviewMode(true)}
                            className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-all ${previewMode ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                                }`}
                        >
                            <Eye size={12} />
                            미리보기
                        </button>
                    </div>
                </div>
            </div>

            {/* Code Block Language Select (Contextual) */}
            {isCodeBlockActive && (
                <div className="mt-2 flex items-center gap-2 border-t border-[color:var(--border)] pt-2 animate-in slide-in-from-top-1">
                    <span className="text-xs font-medium text-[var(--text-muted)]">코드 언어:</span>
                    <div className="flex gap-1 flex-wrap">
                        {CODE_LANGUAGES.map(lang => (
                            <button
                                key={lang.value}
                                onClick={() => editor?.chain().focus().setCodeBlock({ language: lang.value }).run()}
                                className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${codeBlockLanguage === lang.value
                                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                                    : 'border-[color:var(--border)] hover:bg-[var(--surface-muted)]'
                                    }`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                단축키: Ctrl/Cmd+S 저장 · Ctrl/Cmd+Shift+S 초안 저장 · Ctrl/Cmd+Enter 발행 · Alt+Shift+P 미리보기 전환
            </p>
        </div>
    );
};

import React, { useMemo, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import PostContent from '../../PostContent';
import type { PostStatus } from '../../../data/blogData';
import type { PostDraft } from '../../../types/admin';
import { formatAutosaveTime } from '../../../utils/adminDate';
import type { CategoryNode, CategoryTreeResult } from '../../../utils/categoryTree';
import { DEFAULT_CATEGORY, normalizeCategoryKey } from '../../../utils/category';

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

interface PostEditorSectionProps {
  draft: PostDraft;
  categoryTree: CategoryTreeResult;
  contentStats: { chars: number; readingMinutes: number };
  notice: string;
  saving: boolean;
  activeId: string | null;
  lastAutosavedAt: number | null;
  autosavePaused: boolean;
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onTagKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onTagBlur: () => void;
  onRemoveTag: (tag: string) => void;
  onTitleChange: (value: string) => void;
  onStatusChange: (value: PostStatus) => void;
  onSave: (message?: string, statusOverride?: PostStatus) => void;
  onReset: () => void;
  onDelete: () => void;
  updateDraft: (patch: Partial<PostDraft>) => void;
  previewMode: boolean;
  setPreviewMode: (value: boolean) => void;
  editor: Editor | null;
  onLink: () => void;
  onToolbarImageUpload: () => void;
  onInsertImageUrl: () => void;
  uploadingImage: boolean;
  uploadError: string;
  imageWidthInput: string;
  imageWidthError: string;
  onImageWidthInputChange: (value: string) => void;
  onApplyImageWidth: () => void;
  onClearImageWidth: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onImageUpload: (file: File) => void;
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

const CODE_LANGUAGES = [
  { value: 'plaintext', label: '기본' },
  { value: 'bash', label: 'Bash' },
  { value: 'css', label: 'CSS' },
  { value: 'xml', label: 'HTML' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL' }
];

const FONT_FAMILIES = [
  { value: 'default', label: '기본서체' },
  { value: 'Nanum Gothic', label: '나눔고딕' },
  { value: 'JetBrains Mono, monospace', label: '모노' },
  { value: 'serif', label: 'Serif' }
];

const FONT_SIZES = [
  { value: 'default', label: '본문' },
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
  { value: '28px', label: '28' },
  { value: '32px', label: '32' }
];

const TEXT_COLORS = [
  '#1d1916',
  '#0f766e',
  '#2563eb',
  '#6b21a8',
  '#b45309',
  '#b91c1c',
  '#4b5563'
];

const HIGHLIGHT_COLORS = [
  '#fef3c7',
  '#d1fae5',
  '#dbeafe',
  '#fee2e2',
  '#ede9fe',
  '#fce7f3'
];



const PostEditorSection: React.FC<PostEditorSectionProps> = ({
  draft,
  categoryTree,
  contentStats,
  notice,
  saving,
  activeId,
  lastAutosavedAt,
  autosavePaused,
  tagInput,
  onTagInputChange,
  onTagKeyDown,
  onTagBlur,
  onRemoveTag,
  onTitleChange,
  onStatusChange,
  onSave,
  onReset,
  onDelete,
  updateDraft,
  previewMode,
  setPreviewMode,
  editor,
  onLink,
  onToolbarImageUpload,
  onInsertImageUrl,
  uploadingImage,
  uploadError,
  imageWidthInput,
  imageWidthError,
  onImageWidthInputChange,
  onApplyImageWidth,
  onClearImageWidth,
  fileInputRef,
  onImageUpload
}) => {
  const headingValue = editor?.isActive('heading', { level: 1 })
    ? 'h1'
    : editor?.isActive('heading', { level: 2 })
      ? 'h2'
      : editor?.isActive('heading', { level: 3 })
        ? 'h3'
        : 'paragraph';
  const isImageActive = editor?.isActive('image') ?? false;
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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [categoryExpanded, setCategoryExpanded] = useState<Record<string, boolean>>({});
  const [toolbarMenu, setToolbarMenu] = useState<
    'color' | 'highlight' | 'emoji' | 'table' | null
  >(null);

  const getNodePath = (node: CategoryNode) => {
    const path: string[] = [];
    let current: CategoryNode | undefined = node;
    while (current) {
      path.unshift(current.name);
      current = current.parentId ? categoryTree.nodesById.get(current.parentId) : undefined;
    }
    return path.join(' > ');
  };

  const categoryPath = useMemo(() => {
    const name = draft.category || DEFAULT_CATEGORY;
    const key = normalizeCategoryKey(name);
    const node = categoryTree.nodesByKey.get(key);
    if (!node) return name;
    return getNodePath(node);
  }, [categoryTree, draft.category]);

  const categoryResults = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) return [];
    return Array.from(categoryTree.nodesById.values())
      .filter(node => node.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
      .map(node => ({ node, path: getNodePath(node) }));
  }, [categoryQuery, categoryTree]);

  const toggleCategoryNode = (id: string) => {
    setCategoryExpanded(prev => {
      const current = prev[id];
      return { ...prev, [id]: current === undefined ? false : !current };
    });
  };

  const selectCategory = (name: string) => {
    updateDraft({ category: name });
    setCategoryOpen(false);
    setCategoryQuery('');
  };

  const toggleToolbarMenu = (menu: 'color' | 'highlight' | 'emoji' | 'table') => {
    setToolbarMenu(prev => (prev === menu ? null : menu));
  };

  const closeToolbarMenu = () => {
    setToolbarMenu(null);
  };

  const renderCategoryNode = (node: CategoryNode, depth: number) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = categoryExpanded[node.id] ?? true;
    const isActive =
      normalizeCategoryKey(draft.category || DEFAULT_CATEGORY) ===
      normalizeCategoryKey(node.name);
    const paddingLeft = depth * 14;

    return (
      <li key={node.id}>
        <div className="flex items-center gap-2" style={{ paddingLeft }}>
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleCategoryNode(node.id)}
              className="flex h-4 w-4 items-center justify-center text-[var(--text-muted)]"
              aria-label={`${node.name} 토글`}
            >
              <svg
                className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M9 6l6 6-6 6" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <span className="h-4 w-4" />
          )}
          <button
            type="button"
            onClick={() => selectCategory(node.name)}
            className={`flex flex-1 items-center justify-between rounded-2xl border px-3 py-2 text-sm transition ${isActive
              ? 'border-[color:var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
              : 'border-[color:var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)] hover:border-[color:var(--accent)] hover:text-[var(--text)]'
              }`}
          >
            <span>{node.name}</span>
            <span className="text-xs">{node.count}</span>
          </button>
        </div>
        {hasChildren && isExpanded && (
          <ul className="mt-2 space-y-2">
            {node.children.map(child => renderCategoryNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        {/* Top Actions & Status */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-4">
            {/* Title */}
            <input
              value={draft.title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full bg-transparent text-3xl font-bold text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-col items-end gap-1 text-[10px] text-[var(--text-muted)]">
              {notice && <span className="text-[var(--accent-strong)]">{notice}</span>}
              {lastAutosavedAt && !autosavePaused && (
                <span>자동 저장 {formatAutosaveTime(lastAutosavedAt)}</span>
              )}
            </div>
            {/* Status Badge Select - Compact */}
            <div className="relative">
              <select
                value={draft.status}
                onChange={(event) => onStatusChange(event.target.value as PostStatus)}
                className={`appearance-none rounded-full border px-4 py-2 text-xs font-semibold focus:outline-none ${draft.status === 'published'
                  ? 'border-transparent bg-[var(--accent)] text-white'
                  : 'border-[color:var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]'
                  }`}
              >
                <option value="draft">초안</option>
                <option value="scheduled">예약</option>
                <option value="published">발행</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => onSave()}
              disabled={saving}
              className="rounded-full bg-[var(--text)] px-5 py-2 text-xs font-semibold text-[var(--bg)] disabled:opacity-50"
            >
              {saving ? '저장...' : activeId ? '수정' : '저장'}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="h-8 w-8 rounded-full border border-[color:var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center p-0"
              title="초기화"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" /><path d="M3 3v9h9" /></svg>
            </button>
            {activeId && (
              <button
                type="button"
                onClick={onDelete}
                className="h-8 w-8 rounded-full border border-[color:var(--border)] text-red-500 hover:bg-red-50 flex items-center justify-center p-0"
                title="삭제"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Meta Fields Grid - Compact */}
        <div className="mt-6 grid gap-4 border-t border-[color:var(--border)] pt-6 md:grid-cols-12 bg-transparent">
          {/* Category - Col 6 */}
          <div className="md:col-span-6 relative group">
            <label className="block text-[10px] text-[var(--text-muted)] mb-1">카테고리</label>
            <button
              type="button"
              onClick={() => setCategoryOpen(prev => !prev)}
              className="flex w-full items-center justify-between rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text)] transition-colors hover:border-[color:var(--accent)]"
            >
              <span className="truncate">{categoryPath || DEFAULT_CATEGORY}</span>
              <svg className="h-3 w-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {categoryOpen && (
              <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[200px] rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-2 shadow-xl">
                <input
                  autoFocus
                  value={categoryQuery}
                  onChange={(e) => setCategoryQuery(e.target.value)}
                  placeholder="검색..."
                  className="mb-2 w-full rounded-lg bg-[var(--surface-muted)] px-2 py-1.5 text-xs focus:outline-none"
                />
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {/* Default Category */}
                  <button
                    onClick={() => selectCategory(DEFAULT_CATEGORY)}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[var(--surface-muted)] text-xs"
                  >
                    {DEFAULT_CATEGORY}
                  </button>
                  {/* Tree */}
                  {categoryQuery.trim() ? (
                    categoryResults.map(res => (
                      <button key={res.node.id} onClick={() => selectCategory(res.node.name)} className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[var(--surface-muted)] text-xs">
                        <div className="font-medium">{res.node.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{res.path}</div>
                      </button>
                    ))
                  ) : (
                    categoryTree.roots.filter(n => normalizeCategoryKey(n.name) !== normalizeCategoryKey(DEFAULT_CATEGORY)).map(node => renderCategoryNode(node, 0))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Date/Schedule - Col 6 */}
          <div className="md:col-span-6">
            <label className="block text-[10px] text-[var(--text-muted)] mb-1">
              {draft.status === 'scheduled' ? '예약 시간' : '발행일'}
            </label>
            {draft.status === 'scheduled' ? (
              <input
                type="datetime-local"
                value={draft.scheduledAt}
                onChange={(e) => updateDraft({ scheduledAt: e.target.value })}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text)] focus:border-[color:var(--accent)] focus:outline-none"
              />
            ) : (
              <input
                type="date"
                value={draft.publishedAt}
                onChange={(e) => updateDraft({ publishedAt: e.target.value })}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text)] focus:border-[color:var(--accent)] focus:outline-none"
              />
            )}
          </div>

          {/* Summary - Full Width */}
          <div className="md:col-span-12">
            <label className="block text-[10px] text-[var(--text-muted)] mb-1">요약 / Featured</label>
            <div className="flex gap-2">
              <textarea
                value={draft.summary}
                onChange={(e) => updateDraft({ summary: e.target.value })}
                rows={1}
                className="flex-1 rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text)] focus:border-[color:var(--accent)] focus:outline-none resize-none"
                placeholder="글 요약..."
              />
              <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 transition-colors ${draft.featured ? 'border-[color:var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[color:var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]'}`}>
                <input type="checkbox" checked={draft.featured} onChange={(e) => updateDraft({ featured: e.target.checked })} className="hidden" />
                <span className="text-xs font-bold">추천</span>
              </label>
            </div>
          </div>
        </div>

        {/* Editor Toolbar - Sticky? */}
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

        {isImageActive && (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] p-3 text-xs text-[var(--text)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-[var(--text-muted)]">
                이미지 크기
              </span>
              <input
                value={imageWidthInput}
                onChange={(event) => onImageWidthInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onApplyImageWidth();
                  }
                }}
                placeholder="예: 640 또는 640px"
                className="w-40 rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text)]"
              />
              <button
                type="button"
                onClick={onApplyImageWidth}
                className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] font-semibold text-[var(--text)]"
              >
                적용
              </button>
              <button
                type="button"
                onClick={onClearImageWidth}
                className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] font-semibold text-[var(--text-muted)]"
              >
                초기화
              </button>
              <span className="text-[11px] text-[var(--text-muted)]">
                px만 지원합니다. 숫자만 입력하면 px로 적용됩니다.
              </span>
            </div>
            {imageWidthError && (
              <p className="mt-2 text-xs text-red-500">{imageWidthError}</p>
            )}
          </div>
        )}

        {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImageUpload(file);
            }
            event.target.value = '';
          }}
        />

        {previewMode ? (
          <div className="min-h-[500px] p-2">
            {draft.contentHtml.trim() ? (
              <PostContent contentHtml={draft.contentHtml} />
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                미리볼 내용이 없습니다. 본문을 입력해 주세요.
              </p>
            )}
          </div>
        ) : (
          <div className="min-h-[500px] border-none shadow-none outline-none ring-0">
            {/* Seamless Editor without border */}
            <EditorContent editor={editor} className="border-none shadow-none outline-none ring-0" />
          </div>
        )}

        {/* Footer: Tags */}
        <div className="mt-8 -mx-6 -mb-6 rounded-b-3xl border-t border-[color:var(--border)] bg-[var(--surface-muted)] p-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--text-muted)]">
              태그
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {contentStats.chars}자 · {contentStats.readingMinutes}분
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {draft.tags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] text-[var(--text-muted)]"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="text-[10px] text-[var(--text-muted)] hover:text-red-500"
                  aria-label="태그 삭제"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(event) => onTagInputChange(event.target.value)}
              onKeyDown={onTagKeyDown}
              onBlur={onTagBlur}
              placeholder="태그 입력 후 Enter"
              className="min-w-[160px] flex-1 rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-4 py-2 text-xs text-[var(--text)] focus:border-[color:var(--accent)] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostEditorSection;

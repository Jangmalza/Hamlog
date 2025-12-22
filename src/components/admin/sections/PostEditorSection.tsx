import React from 'react';
import { EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import PostContent from '../../PostContent';
import type { PostStatus } from '../../../data/blogData';
import type { PostDraft } from '../../../types/admin';
import { formatAutosaveTime } from '../../../utils/adminDate';

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

interface PostEditorSectionProps {
  draft: PostDraft;
  availableCategories: string[];
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
  onSlugChange: (value: string) => void;
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
  disabled
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
      active
        ? 'border-[color:var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
        : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
    } disabled:cursor-not-allowed disabled:opacity-60`}
  >
    {label}
  </button>
);

const PostEditorSection: React.FC<PostEditorSectionProps> = ({
  draft,
  availableCategories,
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
  onSlugChange,
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

  return (
    <>
      <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">글 정보</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {lastAutosavedAt && !autosavePaused && (
              <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] text-[var(--text-muted)]">
                자동 저장 {formatAutosaveTime(lastAutosavedAt)}
              </span>
            )}
            {notice && (
              <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] text-[var(--text-muted)]">
                {notice}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] md:col-span-2">
            슬러그
            <input
              value={draft.slug}
              onChange={(event) => onSlugChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] md:col-span-2">
            요약
            <textarea
              value={draft.summary}
              onChange={(event) => updateDraft({ summary: event.target.value })}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            발행 상태
            <select
              value={draft.status}
              onChange={(event) => onStatusChange(event.target.value as PostStatus)}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
            >
              <option value="draft">초안</option>
              <option value="scheduled">예약 발행</option>
              <option value="published">발행</option>
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            예약 발행 시간
            <input
              type="datetime-local"
              value={draft.scheduledAt}
              onChange={(event) => updateDraft({ scheduledAt: event.target.value })}
              disabled={draft.status !== 'scheduled'}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <span className="mt-2 block text-[11px] text-[var(--text-muted)]">
              예약 발행은 로컬 시간 기준이며, 예약 상태에서만 입력됩니다.
            </span>
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            발행일
            <input
              type="date"
              value={draft.publishedAt}
              onChange={(event) => updateDraft({ publishedAt: event.target.value })}
              disabled={draft.status === 'scheduled'}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60"
            />
            {draft.status === 'scheduled' && (
              <span className="mt-2 block text-[11px] text-[var(--text-muted)]">
                예약 발행일은 예약 시간 기준으로 자동 저장됩니다.
              </span>
            )}
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            읽는 시간
            <input
              value={draft.readingTime}
              onChange={(event) => updateDraft({ readingTime: event.target.value })}
              placeholder="5분 읽기"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
            />
            <span className="mt-2 block text-[11px] text-[var(--text-muted)]">
              예상 읽기 {contentStats.readingMinutes}분
            </span>
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            시리즈
            <input
              value={draft.series}
              onChange={(event) => updateDraft({ series: event.target.value })}
              placeholder="선택"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] md:col-span-2">
            커버 이미지 URL
            <input
              value={draft.cover}
              onChange={(event) => updateDraft({ cover: event.target.value })}
              placeholder="https://..."
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
            />
          </label>
          <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(event) => updateDraft({ featured: event.target.checked })}
              className="h-4 w-4 rounded border-[color:var(--border)]"
            />
            추천 글
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onSave()}
            disabled={saving}
            className="rounded-full bg-[var(--accent)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? '저장 중...' : activeId ? '저장' : '새 글 생성'}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={saving}
            className="rounded-full border border-[color:var(--border)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            초기화
          </button>
          {activeId && (
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className="rounded-full border border-[color:var(--border)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              삭제
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
              SEO
            </p>
            <h2 className="mt-2 font-display text-lg font-semibold">검색 설정</h2>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            검색/공유 메타데이터를 설정합니다.
          </span>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] md:col-span-2">
            SEO 제목
            <input
              value={draft.seoTitle}
              onChange={(event) => updateDraft({ seoTitle: event.target.value })}
              placeholder="기본값: 글 제목"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
            />
            <span className="mt-2 block text-[11px] text-[var(--text-muted)]">
              50~60자 내외를 권장합니다.
            </span>
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] md:col-span-2">
            SEO 설명
            <textarea
              value={draft.seoDescription}
              onChange={(event) => updateDraft({ seoDescription: event.target.value })}
              rows={3}
              placeholder="기본값: 요약"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
            />
            <span className="mt-2 block text-[11px] text-[var(--text-muted)]">
              140~160자 내외로 작성하면 좋습니다.
            </span>
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            OG 이미지 URL
            <input
              value={draft.seoOgImage}
              onChange={(event) => updateDraft({ seoOgImage: event.target.value })}
              placeholder="기본값: 커버 이미지"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Canonical URL
            <input
              value={draft.seoCanonicalUrl}
              onChange={(event) => updateDraft({ seoCanonicalUrl: event.target.value })}
              placeholder="https://example.com/post-slug"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] md:col-span-2">
            키워드
            <input
              value={draft.seoKeywords}
              onChange={(event) => updateDraft({ seoKeywords: event.target.value })}
              placeholder="예: React, 상태관리, 디자인 시스템"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
            />
            <span className="mt-2 block text-[11px] text-[var(--text-muted)]">
              쉼표로 구분해서 입력하세요.
            </span>
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
              본문 편집
            </p>
            <h2 className="font-display text-lg font-semibold">본문</h2>
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            글자수 {contentStats.chars}자 · 예상 읽기 {contentStats.readingMinutes}분
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            카테고리
            <input
              list="category-options"
              value={draft.category}
              onChange={(event) => updateDraft({ category: event.target.value })}
              placeholder="예: UI 아키텍처"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
            />
          </label>
          <datalist id="category-options">
            {availableCategories.map(category => (
              <option key={category} value={category} />
            ))}
          </datalist>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            제목
            <input
              value={draft.title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="제목을 입력하세요"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-4 text-2xl font-semibold text-[var(--text)]"
            />
          </label>
          <div className="h-px w-full bg-[var(--border)]" />

          <div className="sticky top-4 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] p-3 shadow-[var(--shadow)]">
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
            <ToolbarButton
              label="B"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive('bold')}
              disabled={!editor}
            />
            <ToolbarButton
              label="I"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive('italic')}
              disabled={!editor}
            />
            <ToolbarButton
              label="U"
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              active={editor?.isActive('underline')}
              disabled={!editor}
            />
            <ToolbarButton
              label="S"
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              active={editor?.isActive('strike')}
              disabled={!editor}
            />
            <ToolbarButton
              label="• 목록"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive('bulletList')}
              disabled={!editor}
            />
            <ToolbarButton
              label="1. 목록"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive('orderedList')}
              disabled={!editor}
            />
            <ToolbarButton
              label="좌"
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              active={editor?.isActive({ textAlign: 'left' })}
              disabled={!editor}
            />
            <ToolbarButton
              label="중"
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              active={editor?.isActive({ textAlign: 'center' })}
              disabled={!editor}
            />
            <ToolbarButton
              label="우"
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              active={editor?.isActive({ textAlign: 'right' })}
              disabled={!editor}
            />
            <ToolbarButton
              label="인용"
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              active={editor?.isActive('blockquote')}
              disabled={!editor}
            />
            <ToolbarButton
              label="코드"
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              active={editor?.isActive('codeBlock')}
              disabled={!editor}
            />
            <ToolbarButton
              label="구분선"
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              disabled={!editor}
            />
            <ToolbarButton
              label="링크"
              onClick={onLink}
              active={editor?.isActive('link')}
              disabled={!editor}
            />
            <ToolbarButton
              label={uploadingImage ? '업로드 중' : '이미지'}
              onClick={onToolbarImageUpload}
              disabled={!editor || uploadingImage}
            />
            <ToolbarButton
              label="이미지 URL"
              onClick={onInsertImageUrl}
              disabled={!editor}
            />
            <ToolbarButton
              label="되돌리기"
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor}
            />
            <ToolbarButton
              label="다시"
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor}
            />
            <div className="ml-auto flex items-center gap-2">
              <ToolbarButton
                label="편집"
                onClick={() => setPreviewMode(false)}
                active={!previewMode}
                disabled={!editor}
              />
              <ToolbarButton
                label="미리보기"
                onClick={() => setPreviewMode(true)}
                active={previewMode}
                disabled={!editor}
              />
            </div>
          </div>

          {isImageActive && (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] p-3 text-xs text-[var(--text)]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
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
                  className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text)]"
                >
                  적용
                </button>
                <button
                  type="button"
                  onClick={onClearImageWidth}
                  className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]"
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
            <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-6">
              {draft.contentHtml.trim() ? (
                <PostContent contentHtml={draft.contentHtml} />
              ) : (
                <p className="text-sm text-[var(--text-muted)]">
                  미리볼 내용이 없습니다. 본문을 입력해 주세요.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--surface)]">
              <EditorContent editor={editor} />
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
              태그
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {draft.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] text-[var(--text-muted)]"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => onRemoveTag(tag)}
                    className="text-[10px] text-[var(--text-muted)]"
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
                className="min-w-[160px] flex-1 rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-xs text-[var(--text)]"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[color:var(--border)] pt-4">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="rounded-full border border-[color:var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text)]"
            >
              {previewMode ? '편집으로' : '미리보기'}
            </button>
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSave('임시 저장되었습니다.', 'draft')}
                disabled={saving}
                className="rounded-full border border-[color:var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                임시 저장
              </button>
              <button
                type="button"
                onClick={() => onSave()}
                disabled={saving}
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostEditorSection;

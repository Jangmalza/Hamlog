import React from 'react';
import { EditorContent } from '@tiptap/react';
import { ChevronDown } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import PostContent from '../../PostContent';
import type { PostStatus } from '../../../data/blogData';
import type { PostDraft } from '../../../types/admin';

import type { CategoryTreeResult } from '../../../utils/categoryTree';
import { EditorToolbar } from '../../editor/EditorToolbar';
import { PostMetadata } from '../PostMetadata';
import { EditorActionContext } from '../../../contexts/EditorActionContext';
import { TableBubbleMenu } from '../../editor/extensions/TableBubbleMenu';

export interface EditorHandlers {
  onTitleChange: (value: string) => void;
  onStatusChange: (value: PostStatus) => void;
  onSave: (message?: string, statusOverride?: PostStatus) => void;
  onDelete: () => void;
  updateDraft: (patch: Partial<PostDraft>) => void;
  setPreviewMode: (value: boolean) => void;
  onLink: () => void;
}

export interface TagHandlers {
  onInputChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onRemove: (tag: string) => void;
}

export interface MediaHandlers {
  onToolbarUpload: () => void;
  onInsertImageUrl: () => void;
  onImageUpload: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onCoverUpload?: (file: File) => Promise<void>;
  onSetCoverFromContent?: (src?: string) => void;
  uploadLocalImage?: (file: File) => Promise<{ url: string }>;
}

export interface UIState {
  notice: string;
  saving: boolean;
  activeId: string | null;
  tagInput: string;
  previewMode: boolean;
  uploadingImage: boolean;
  uploadError: string | null;
  onNoticeClick?: () => void;
}

export interface EditorData {
  draft: PostDraft;
  categoryTree: CategoryTreeResult;
  contentStats: { chars: number; readingMinutes: number };
  currentCoverUrl?: string;
  editor: Editor | null;
}

interface PostEditorSectionProps {
  editorHandlers: EditorHandlers;
  tagHandlers: TagHandlers;
  mediaHandlers: MediaHandlers;
  uiState: UIState;
  data: EditorData;
}

const PostEditorSection: React.FC<PostEditorSectionProps> = ({
  editorHandlers,
  tagHandlers,
  mediaHandlers,
  uiState,
  data
}) => {
  const { draft, categoryTree, contentStats, currentCoverUrl, editor } = data;
  const { notice, saving, activeId, tagInput, previewMode, uploadingImage, uploadError, onNoticeClick } = uiState;
  const { onTitleChange, onStatusChange, onSave, onDelete, updateDraft, setPreviewMode, onLink } = editorHandlers;
  const { onInputChange, onKeyDown, onBlur, onRemove } = tagHandlers;
  const { onToolbarUpload, onInsertImageUrl, onImageUpload, fileInputRef, onCoverUpload, onSetCoverFromContent } = mediaHandlers;

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
              {notice && (
                <button
                  type="button"
                  onClick={() => onNoticeClick?.()}
                  className={`text-[var(--accent-strong)] ${onNoticeClick ? 'cursor-pointer hover:underline underline' : ''}`}
                >
                  {notice}
                </button>
              )}
            </div>
            {/* Status Badge Select - Compact */}
            <div className="relative">
              <select
                value={draft.status}
                onChange={(event) => onStatusChange(event.target.value as PostStatus)}
                className={`appearance-none cursor-pointer rounded-full border pl-4 pr-9 py-2 text-xs font-semibold transition-colors focus:outline-none ${draft.status === 'published'
                  ? 'border-transparent bg-[var(--accent)] text-white'
                  : 'border-[color:var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                  }`}
              >
                <option value="draft">초안</option>
                <option value="scheduled">예약</option>
                <option value="published">발행</option>
              </select>
              <div className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${draft.status === 'published' ? 'text-white/80' : 'text-[var(--text-muted)]'
                }`}>
                <ChevronDown size={14} strokeWidth={2.5} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSave()}
              disabled={saving}
              className="rounded-full bg-[var(--text)] px-5 py-2 text-xs font-semibold text-[var(--bg)] disabled:opacity-50"
            >
              {saving ? '저장...' : activeId ? '수정' : '저장'}
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
        <PostMetadata
          draft={draft}
          updateDraft={updateDraft}
          categoryTree={categoryTree}
          onCoverUpload={onCoverUpload}
        />

        {/* Editor Toolbar - Sticky */}
        <EditorToolbar
          editor={editor}
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
          onLink={onLink}
          onToolbarImageUpload={onToolbarUpload}
          onInsertImageUrl={onInsertImageUrl}
          uploadingImage={uploadingImage}
          onSave={() => onSave('수동 저장되었습니다.')}
        />

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

        <div className={previewMode ? 'block min-h-[500px] p-2' : 'hidden'}>
          {draft.contentHtml.trim() ? (
            <PostContent contentHtml={draft.contentHtml} />
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              미리볼 내용이 없습니다. 본문을 입력해 주세요.
            </p>
          )}
        </div>

        <div className={!previewMode ? 'block min-h-[500px] border-none shadow-none outline-none ring-0' : 'hidden'}>
          {/* Seamless Editor without border */}
          <EditorActionContext.Provider value={{
            onSetCover: (src) => onSetCoverFromContent?.(src),
            currentCoverUrl,
            onToolbarUpload,
            uploadLocalImage: mediaHandlers.uploadLocalImage
          }}>
            <EditorContent editor={editor} className="border-none shadow-none outline-none ring-0" />
            <TableBubbleMenu editor={editor} />
          </EditorActionContext.Provider>
        </div>

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
                  onClick={() => onRemove(tag)}
                  className="text-[10px] text-[var(--text-muted)] hover:text-red-500"
                  aria-label="태그 삭제"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={onKeyDown}
              onBlur={onBlur}
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

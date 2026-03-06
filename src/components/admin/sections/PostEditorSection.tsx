import React from 'react';
import { EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import PostContent from '../../PostContent';
import type { PostRevision, PostStatus } from '../../../data/blogData';
import type { PostDraft } from '../../../types/admin';
import type { CategoryTreeResult } from '../../../utils/categoryTree';
import { EditorToolbar } from '../../editor/EditorToolbar';
import { EditorActionContext } from '../../../contexts/EditorActionContext';
import { TableBubbleMenu } from '../../editor/extensions/TableBubbleMenu';
import { ColumnBubbleMenu } from '../../editor/extensions/ColumnBubbleMenu';
import type { TocItem } from '../../TableOfContents';
import PostCommandBar from '../post/PostCommandBar';
import PostInspector from '../post/PostInspector';

export interface EditorHandlers {
  onTitleChange: (value: string) => void;
  onStatusChange: (value: PostStatus) => void;
  onSave: (message?: string, statusOverride?: PostStatus) => void;
  onDelete: () => void;
  onRestoreRevision: (revisionId: string) => void;
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
  revisionsLoading?: boolean;
  restoringRevisionId?: string | null;
  onNoticeClick?: () => void;
  hasRestorableDraft?: boolean;
  autosaveUpdatedAt?: string | null;
  onRestoreAutosave?: () => void;
  onDiscardAutosave?: () => void;
}

export interface EditorData {
  draft: PostDraft;
  categoryTree: CategoryTreeResult;
  revisions: PostRevision[];
  contentStats: { chars: number; words: number; readingMinutes: number };
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
  const { draft, categoryTree, revisions, contentStats, currentCoverUrl, editor } = data;
  const {
    notice,
    saving,
    activeId,
    tagInput,
    previewMode,
    uploadingImage,
    uploadError,
    revisionsLoading,
    restoringRevisionId,
    onNoticeClick,
    hasRestorableDraft,
    autosaveUpdatedAt,
    onRestoreAutosave,
    onDiscardAutosave
  } = uiState;
  const {
    onTitleChange,
    onStatusChange,
    onSave,
    onDelete,
    onRestoreRevision,
    updateDraft,
    setPreviewMode,
    onLink
  } = editorHandlers;
  const { onInputChange, onKeyDown, onBlur, onRemove } = tagHandlers;
  const {
    onToolbarUpload,
    onInsertImageUrl,
    onImageUpload,
    fileInputRef,
    onCoverUpload,
    onSetCoverFromContent
  } = mediaHandlers;

  const autosaveLabel = (() => {
    if (!autosaveUpdatedAt) return '';
    const timestamp = new Date(autosaveUpdatedAt);
    if (Number.isNaN(timestamp.getTime())) return '';
    return timestamp.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  })();

  const [tocItems, setTocItems] = React.useState<TocItem[]>([]);

  React.useEffect(() => {
    if (!editor) return;

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

  const handleTocLinkClick = (id: string) => {
    const pos = Number.parseInt(id.replace('heading-', ''), 10);
    if (Number.isNaN(pos) || !editor) return;
    editor.commands.focus(pos);
    const element = editor.view.nodeDOM(pos) as HTMLElement | null;
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <div className="rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-lg bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {activeId ? '편집 중인 글' : '새 글 초안'}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    `Ctrl/Cmd + S` 저장, `Ctrl/Cmd + Enter` 발행, `Alt + Shift + P` 미리보기
                  </span>
                </div>
                <input
                  value={draft.title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  placeholder="제목을 입력하세요"
                  className="w-full bg-transparent text-4xl font-bold leading-tight text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
                />
              </div>

              <PostCommandBar
                activeId={activeId}
                status={draft.status}
                saving={saving}
                previewMode={previewMode}
                notice={notice}
                onNoticeClick={onNoticeClick}
                hasRestorableDraft={hasRestorableDraft}
                autosaveLabel={autosaveLabel}
                onRestoreAutosave={onRestoreAutosave}
                onDiscardAutosave={onDiscardAutosave}
                onStatusChange={onStatusChange}
                onTogglePreview={() => setPreviewMode(!previewMode)}
                onSave={() => onSave('수동 저장되었습니다.')}
                onPublish={() => onSave('발행되었습니다.', 'published')}
                onDelete={onDelete}
              />

              <div className="rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] p-3">
                <EditorToolbar
                  editor={editor}
                  onLink={onLink}
                  onToolbarImageUpload={onToolbarUpload}
                  onInsertImageUrl={onInsertImageUrl}
                  uploadingImage={uploadingImage}
                />
              </div>

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

              <div
                className={
                  previewMode
                    ? 'block min-h-[720px] rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] p-6'
                    : 'hidden'
                }
              >
                {draft.contentHtml.trim() ? (
                  <PostContent contentHtml={draft.contentHtml} />
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">
                    미리볼 내용이 없습니다. 본문을 입력해 주세요.
                  </p>
                )}
              </div>

              <div
                className={
                  !previewMode
                    ? 'block min-h-[720px] rounded-xl border border-[color:var(--border)] bg-[linear-gradient(180deg,var(--surface),var(--surface-muted))] p-4'
                    : 'hidden'
                }
              >
                <EditorActionContext.Provider
                  value={{
                    onSetCover: (src) => onSetCoverFromContent?.(src),
                    currentCoverUrl,
                    onToolbarUpload,
                    uploadLocalImage: mediaHandlers.uploadLocalImage
                  }}
                >
                  <EditorContent
                    editor={editor}
                    className="border-none shadow-none outline-none ring-0 [&_.ProseMirror]:min-h-[660px] [&_.ProseMirror]:rounded-lg [&_.ProseMirror]:bg-[var(--surface)] [&_.ProseMirror]:px-6 [&_.ProseMirror]:py-6 [&_.ProseMirror]:shadow-[0_24px_60px_-36px_rgba(11,35,32,0.55)]"
                  />
                  <TableBubbleMenu editor={editor} />
                  <ColumnBubbleMenu editor={editor} />
                </EditorActionContext.Provider>
              </div>
            </div>
          </div>
        </div>

        <PostInspector
          activeId={activeId}
          draft={draft}
          categoryTree={categoryTree}
          revisions={revisions}
          revisionsLoading={revisionsLoading}
          restoringRevisionId={restoringRevisionId}
          contentStats={contentStats}
          tagInput={tagInput}
          onTagInputChange={onInputChange}
          onTagKeyDown={onKeyDown}
          onTagBlur={onBlur}
          onRemoveTag={onRemove}
          onUpdateDraft={updateDraft}
          onCoverUpload={onCoverUpload}
          onRestoreRevision={onRestoreRevision}
          tocItems={tocItems}
          onTocLinkClick={handleTocLinkClick}
        />
      </div>
    </div>
  );
};

export default PostEditorSection;

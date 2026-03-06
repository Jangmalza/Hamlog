import React from 'react';
import { Eye, EyeOff, Save, Send, Trash2 } from 'lucide-react';
import type { PostStatus } from '../../../data/blogData';

interface PostCommandBarProps {
  activeId: string | null;
  status: PostStatus;
  saving: boolean;
  previewMode: boolean;
  notice: string;
  onNoticeClick?: () => void;
  hasRestorableDraft?: boolean;
  autosaveLabel?: string;
  onRestoreAutosave?: () => void;
  onDiscardAutosave?: () => void;
  onStatusChange: (value: PostStatus) => void;
  onTogglePreview: () => void;
  onSave: () => void;
  onPublish: () => void;
  onDelete: () => void;
}

const statusOptions: Array<{ value: PostStatus; label: string }> = [
  { value: 'draft', label: '초안' },
  { value: 'scheduled', label: '예약' },
  { value: 'published', label: '발행' }
];

const PostCommandBar: React.FC<PostCommandBarProps> = ({
  activeId,
  status,
  saving,
  previewMode,
  notice,
  onNoticeClick,
  hasRestorableDraft,
  autosaveLabel,
  onRestoreAutosave,
  onDiscardAutosave,
  onStatusChange,
  onTogglePreview,
  onSave,
  onPublish,
  onDelete
}) => {
  return (
    <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface-muted)] p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              작업 바
            </p>
            {notice ? (
              <button
                type="button"
                onClick={() => onNoticeClick?.()}
                className={`text-left text-xs ${onNoticeClick ? 'cursor-pointer text-[var(--accent-strong)] hover:underline' : 'text-[var(--text-muted)]'}`}
              >
                {notice}
              </button>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">
                {activeId ? '선택한 글을 편집 중입니다.' : '새 글 초안을 작성 중입니다.'}
              </p>
            )}
            {hasRestorableDraft && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                <span>임시 저장본 {autosaveLabel ? `(${autosaveLabel})` : ''}</span>
                <button
                  type="button"
                  onClick={() => onRestoreAutosave?.()}
                  className="rounded-full border border-[color:var(--border)] px-2.5 py-1 text-[var(--text)] transition hover:border-[color:var(--accent)]"
                >
                  복구
                </button>
                <button
                  type="button"
                  onClick={() => onDiscardAutosave?.()}
                  className="rounded-full border border-[color:var(--border)] px-2.5 py-1 transition hover:border-red-300 hover:text-red-500"
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => onStatusChange(option.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  status === option.value
                    ? 'border-[color:var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                    : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[color:var(--accent)] hover:text-[var(--text)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTogglePreview}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)] transition hover:border-[color:var(--accent)] hover:text-[var(--accent-strong)]"
          >
            {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
            {previewMode ? '편집 보기' : '미리보기'}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)] transition hover:border-[color:var(--accent)] hover:text-[var(--accent-strong)] disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? '저장 중' : '저장'}
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--text)] px-4 py-2 text-xs font-semibold text-[var(--bg)] transition hover:opacity-90 disabled:opacity-50"
          >
            <Send size={14} />
            발행
          </button>
          {activeId && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
            >
              <Trash2 size={14} />
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCommandBar;

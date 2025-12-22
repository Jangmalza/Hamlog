import { useState, useEffect } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import type { Post, PostStatus } from '../../data/blogData';
import type { StoredDraft } from '../../hooks/useDraftAutosave';
import { formatDate } from '../../utils/formatDate';
import { formatScheduleLabel } from '../../utils/adminDate';
import { getPostStatusLabel, normalizePostStatus } from '../../utils/postStatus';
import { TableOfContents } from './TableOfContents';
import type { Editor } from '@tiptap/react';

interface AdminSidebarProps {
  show: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (value: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  onNew: () => void;
  saving: boolean;
  onSelect: (post: Post) => void;
  filteredPosts: Post[];
  activeId: string | null;
  loading: boolean;
  error: string | null;
  onReload: () => void;
  totalCount: number;
  statusCount: Record<PostStatus, number>;
  categories: string[];
  restoreCandidate: StoredDraft | null;
  onRestore: () => void;
  onDiscardRestore: () => void;
  editor: Editor | null;
}

const ITEMS_PER_PAGE = 10;

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  show,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterCategory,
  onFilterCategoryChange,
  page,
  onPageChange,
  onNew,
  onSelect,
  saving,
  filteredPosts,
  activeId,
  loading,
  error,
  onReload,
  totalCount,
  statusCount,
  categories,
  restoreCandidate,
  onRestore,
  onDiscardRestore,
  editor
}) => {
  const [tab, setTab] = useState<'posts' | 'toc'>('posts');

  useEffect(() => {
    if (activeId) {
      // Optional: Auto-switch to ToC when a post is selected? 
      // Maybe not, user might want to switch posts. 
      // Let's keep it manual or default to 'posts'.
    }
  }, [activeId]);

  if (!show) return null;

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <aside className={`flex h-full flex-col gap-6 overflow-y-auto border-b border-[color:var(--border)] bg-[var(--surface)] p-6 lg:h-[calc(100vh-80px)] lg:border-b-0 lg:border-r ${show ? '' : 'hidden lg:flex'}`}>
      <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-muted)] p-1">
        <button
          onClick={() => setTab('posts')}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${tab === 'posts'
            ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
            : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
        >
          글 목록
        </button>
        <button
          onClick={() => setTab('toc')}
          disabled={!editor}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${tab === 'toc'
            ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
            : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            } ${!editor ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          목차
        </button>
      </div>

      {tab === 'toc' && editor ? (
        <div className="animate-fade-in">
          <TableOfContents editor={editor} />
        </div>
      ) : (
        <>
          <div className="relative">
            <input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={filterStatus}
              onChange={e => onFilterStatusChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[color:var(--border)] bg-[var(--surface)] px-4 py-2 text-xs outline-none focus:border-[var(--accent)]"
            >
              <option value="all">모든 상태</option>
              <option value="draft">임시 저장</option>
              <option value="published">공개됨</option>
              <option value="scheduled">예약됨</option>
            </select>
            <select
              value={filterCategory}
              onChange={e => onFilterCategoryChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[color:var(--border)] bg-[var(--surface)] px-4 py-2 text-xs outline-none focus:border-[var(--accent)]"
            >
              <option value="all">모든 카테고리</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>전체 글</span>
                <span className="font-mono font-bold text-[var(--text)]">{totalCount}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[color:var(--border)] pt-3 text-center">
                <div>
                  <div className="text-[10px] text-[var(--text-muted)]">공개</div>
                  <div className="font-mono text-xs font-bold text-[var(--accent)]">
                    {statusCount.published}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-muted)]">예약</div>
                  <div className="font-mono text-xs font-bold text-[var(--text)]">
                    {statusCount.scheduled}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-muted)]">임시</div>
                  <div className="font-mono text-xs font-bold text-[var(--text-muted)]">
                    {statusCount.draft}
                  </div>
                </div>
              </div>
            </div>

            {restoreCandidate && (
              <div className="animate-fade-in rounded-xl border border-[color:var(--accent)] bg-[var(--surface)] p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--accent)]">임시 저장본 발견</span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {formatDate(new Date(restoreCandidate.updatedAt).toISOString())}
                  </span>
                </div>
                <p className="mb-3 text-xs text-[var(--text-muted)]">
                  작성 중이던 글이 있습니다. 복구하시겠습니까?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onRestore}
                    className="flex-1 rounded-lg bg-[var(--accent)] py-1.5 text-xs font-bold text-white transition-colors hover:bg-[var(--accent-strong)]"
                  >
                    복구
                  </button>
                  <button
                    onClick={onDiscardRestore}
                    className="flex-1 rounded-lg bg-[var(--surface-muted)] py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[color:var(--border)]"
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              글 목록
            </h2>
            <button
              type="button"
              onClick={onNew}
              disabled={saving}
              className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-[var(--accent-strong)] hover:shadow-lg disabled:opacity-50"
            >
              새 글 쓰기
            </button>
          </div>

          {loading ? (
            <div className="flex py-8 justify-center">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
              <button
                onClick={onReload}
                className="mt-2 block w-full rounded-lg bg-white py-2 text-xs font-bold shadow-sm transition-transform hover:scale-[1.02] dark:bg-red-900 dark:text-red-100"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {paginatedPosts.map(post => {
                const isSelected = activeId === post.id;
                return (
                  <button
                    key={post.id}
                    onClick={() => onSelect(post)}
                    className={`group relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all hover:shadow-md ${isSelected
                      ? 'border-[var(--accent)] bg-[var(--surface)] ring-1 ring-[var(--accent)]'
                      : 'border-[color:var(--border)] bg-[var(--surface)] hover:border-[var(--accent-soft)]'
                      }`}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <h3
                        className={`font-display text-sm font-bold leading-snug ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                          }`}
                      >
                        {post.title || '제목 없음'}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${getPostStatusLabel(
                          normalizePostStatus(post.status)
                        ).className}`}
                      >
                        {getPostStatusLabel(normalizePostStatus(post.status)).label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                      <span>
                        {post.status === 'scheduled' && post.scheduledAt
                          ? formatScheduleLabel(post.scheduledAt)
                          : formatDate(post.publishedAt)}
                      </span>
                      {post.category && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-[var(--accent)]">
                            {post.category}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {paginatedPosts.length === 0 && (
                <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                  표시할 글이 없습니다.
                </div>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] disabled:opacity-30"
              >
                &lt;
              </button>
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] disabled:opacity-30"
              >
                &gt;
              </button>
            </div>
          )}
        </>
      )}
    </aside>
  );
};

export default AdminSidebar;

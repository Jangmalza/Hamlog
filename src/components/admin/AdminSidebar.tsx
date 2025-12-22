import React from 'react';
import LoadingSpinner from '../LoadingSpinner';
import type { Post, PostStatus } from '../../data/blogData';
import { formatDate } from '../../utils/formatDate';
import { formatScheduleLabel } from '../../utils/adminDate';
import { getPostStatusLabel, normalizePostStatus } from '../../utils/postStatus';

interface AdminSidebarProps {
  show: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNew: () => void;
  saving: boolean;
  onSelect: (post: Post) => void;
  filteredPosts: Post[];
  activeId: string | null;
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  onReload: () => void;
  totalCount: number;
  statusCount: Record<PostStatus, number>;
  defaultCategory: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  show,
  searchQuery,
  onSearchChange,
  onNew,
  onSelect,
  saving,
  filteredPosts,
  activeId,
  loading,
  error,
  hasLoaded,
  onReload,
  totalCount,
  statusCount,
  defaultCategory
}) => (
  <aside
    className={`space-y-6 ${show ? '' : 'invisible pointer-events-none'}`}
    aria-hidden={!show}
  >
    <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          글 목록
        </h2>
        <button
          type="button"
          onClick={onNew}
          disabled={saving}
          className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          새 글
        </button>
      </div>
      <input
        type="search"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="글 검색"
        className="mt-4 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
      />

      {loading && totalCount === 0 && (
        <div className="mt-4">
          <LoadingSpinner message="글 불러오는 중..." />
        </div>
      )}

      {error && totalCount === 0 && (
        <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] p-4 text-center">
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
          <button
            type="button"
            onClick={onReload}
            className="mt-3 rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text)]"
          >
            다시 시도
          </button>
        </div>
      )}

      {filteredPosts.length === 0 && hasLoaded && !loading && !error && (
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          {searchQuery ? '검색 결과가 없습니다.' : '아직 글이 없습니다.'}
        </p>
      )}

      {filteredPosts.length > 0 && (
        <ul className="mt-4 space-y-3">
          {filteredPosts.map(post => {
            const isActive = post.id === activeId;
            const status = normalizePostStatus(post.status);
            const statusLabel = getPostStatusLabel(status);
            const scheduleLabel =
              status === 'scheduled' ? formatScheduleLabel(post.scheduledAt) : '';
            return (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => onSelect(post)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? 'border-[color:var(--accent)] bg-[var(--surface-muted)]'
                      : 'border-[color:var(--border)] bg-[var(--surface)] hover:border-[color:var(--accent)]'
                  }`}
                >
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {post.title}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    {statusLabel}
                    {scheduleLabel ? ` · ${scheduleLabel}` : ''}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    {formatDate(post.publishedAt)} | {post.readingTime}
                  </p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {(post.category ?? defaultCategory)}
                    {post.tags.length ? ` · #${post.tags.join(' #')}` : ' · 태그 없음'}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>

    <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">상태</p>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {totalCount}개의 글이 API 서버에 저장됩니다.
      </p>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        발행 {statusCount.published} · 예약 {statusCount.scheduled} · 초안{' '}
        {statusCount.draft}
      </p>
    </div>
  </aside>
);

export default AdminSidebar;

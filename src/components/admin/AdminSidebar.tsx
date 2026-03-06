import { useMemo } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import type { Post, PostStatus } from '../../data/blogData';

import { formatDate } from '../../utils/formatDate';
import { formatScheduleLabel } from '../../utils/adminDate';
import { getPostStatusLabel, normalizePostStatus } from '../../utils/postStatus';
import type { CategoryTreeResult } from '../../utils/categoryTree';
import { normalizeCategoryKey } from '../../utils/category';
import CategoryPicker from './category/CategoryPicker';

interface AdminSidebarProps {
  show: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (value: string) => void;
  filterCategoryIncludeDescendants: boolean;
  onFilterCategoryIncludeDescendantsChange: (value: boolean) => void;
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
  categoryTree: CategoryTreeResult;
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
  filterCategoryIncludeDescendants,
  onFilterCategoryIncludeDescendantsChange,
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
  categoryTree
}) => {
  const quickCategoryNodes = useMemo(
    () =>
      [...categoryTree.roots]
        .filter(node => normalizeCategoryKey(node.name) !== normalizeCategoryKey('미분류'))
        .sort((left, right) => {
          if (right.count !== left.count) return right.count - left.count;
          return left.name.localeCompare(right.name, 'ko');
        })
        .slice(0, 4),
    [categoryTree.roots]
  );

  if (!show) return null;

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const statusFilters: Array<{ key: PostStatus | 'all'; label: string; count: number }> = [
    { key: 'all', label: '전체', count: totalCount },
    { key: 'draft', label: '초안', count: statusCount.draft },
    { key: 'scheduled', label: '예약', count: statusCount.scheduled },
    { key: 'published', label: '발행', count: statusCount.published }
  ];

  return (
    <aside className={`flex h-full flex-col gap-5 overflow-y-auto rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] lg:sticky lg:top-24 lg:h-[calc(100vh-110px)] ${show ? '' : 'hidden lg:flex'}`}>
      <div className="rounded-xl border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(7,60,53,0.08),rgba(255,255,255,0)_55%),linear-gradient(180deg,var(--surface),var(--surface-muted))] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              콘텐츠 인박스
            </p>
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
              {totalCount}개의 결과
            </h2>
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              초안, 예약, 발행 글을 한 화면에서 탐색하고 바로 편집할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onNew}
            disabled={saving}
            className="rounded-lg bg-[var(--text)] px-4 py-2 text-xs font-semibold text-[var(--bg)] transition hover:opacity-90 disabled:opacity-50"
          >
            새 글 쓰기
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">초안</div>
            <div className="mt-2 text-lg font-semibold text-[var(--text)]">{statusCount.draft}</div>
          </div>
          <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">예약</div>
            <div className="mt-2 text-lg font-semibold text-[var(--text)]">{statusCount.scheduled}</div>
          </div>
          <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">발행</div>
            <div className="mt-2 text-lg font-semibold text-[var(--accent)]">{statusCount.published}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="제목 또는 슬러그 검색"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {statusFilters.map(option => (
            <button
              key={option.key}
              type="button"
              onClick={() => onFilterStatusChange(option.key)}
              className={`rounded-lg border px-3 py-2 text-left transition ${
                filterStatus === option.key
                  ? 'border-[color:var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                  : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[color:var(--accent)] hover:text-[var(--text)]'
              }`}
            >
              <div className="text-[11px] font-semibold">{option.label}</div>
              <div className="mt-1 text-lg font-semibold">{option.count}</div>
            </button>
          ))}
        </div>

        <CategoryPicker
          categoryTree={categoryTree}
          value={filterCategory}
          onChange={onFilterCategoryChange}
          defaultOptionLabel="모든 카테고리"
          mode="filter"
          includeDescendants={filterCategoryIncludeDescendants}
          onIncludeDescendantsChange={onFilterCategoryIncludeDescendantsChange}
          recentStorageKey="hamlog:admin:sidebar-categories"
          triggerClassName="flex w-full items-center justify-between rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition hover:border-[color:var(--accent)]"
          panelClassName="relative z-20 w-full rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-4 shadow-2xl"
        />

        {quickCategoryNodes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quickCategoryNodes.map(node => (
              <button
                key={node.id}
                type="button"
                onClick={() => onFilterCategoryChange(node.name)}
                className={`rounded-lg border px-3 py-1.5 text-[11px] transition ${
                  normalizeCategoryKey(filterCategory) === normalizeCategoryKey(node.name)
                    ? 'border-[color:var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                    : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[color:var(--accent)] hover:text-[var(--text)]'
                }`}
              >
                {node.name} · {node.count}
              </button>
            ))}
          </div>
        )}

        {(filterStatus !== 'all' || filterCategory !== 'all') && (
          <div className="flex flex-wrap gap-2">
            {filterStatus !== 'all' && (
              <button
                type="button"
                onClick={() => onFilterStatusChange('all')}
                className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] text-[var(--text-muted)] transition hover:border-[color:var(--accent)] hover:text-[var(--text)]"
              >
                상태 해제
              </button>
            )}
            {filterCategory !== 'all' && (
              <button
                type="button"
                onClick={() => onFilterCategoryChange('all')}
                className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] text-[var(--text-muted)] transition hover:border-[color:var(--accent)] hover:text-[var(--text)]"
              >
                카테고리 해제
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            글 목록
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            페이지 {page} / {Math.max(totalPages, 1)}
          </p>
        </div>
        <button
          type="button"
          onClick={onReload}
          className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] transition hover:border-[color:var(--accent)] hover:text-[var(--text)]"
        >
          새로고침
        </button>
      </div>

      {loading ? (
        <div className="flex py-8 justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
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
            const normalizedStatus = normalizePostStatus(post.status);
            const statusMeta = getPostStatusLabel(normalizedStatus);

            return (
              <button
                key={post.id}
                onClick={() => onSelect(post)}
                className={`group relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--surface)] shadow-[0_18px_40px_-28px_rgba(8,46,41,0.55)] ring-1 ring-[var(--accent-soft)]'
                    : 'border-[color:var(--border)] bg-[var(--surface)] hover:border-[var(--accent-soft)] hover:shadow-[0_18px_40px_-30px_rgba(8,46,41,0.45)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {post.featured && (
                        <span className="rounded-lg bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-strong)]">
                          추천
                        </span>
                      )}
                      {post.category && (
                        <span className="rounded-lg bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                          {post.category}
                        </span>
                      )}
                    </div>
                    <h3
                      className={`font-display text-base font-bold leading-snug ${
                        isSelected ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                      }`}
                    >
                      {post.title || '제목 없음'}
                    </h3>
                    <p className="text-xs leading-5 text-[var(--text-muted)]">
                      {post.summary || '요약이 없습니다.'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <span>
                    {normalizedStatus === 'scheduled' && post.scheduledAt
                      ? formatScheduleLabel(post.scheduledAt)
                      : formatDate(post.publishedAt)}
                  </span>
                  <span>•</span>
                  <span>{post.readingTime}</span>
                  {post.series && (
                    <>
                      <span>•</span>
                      <span>{post.series}</span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="rounded-lg bg-[var(--surface-muted)] px-2 py-1 text-[10px] text-[var(--text-muted)]"
                    >
                      #{tag}
                    </span>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="rounded-lg bg-[var(--surface-muted)] px-2 py-1 text-[10px] text-[var(--text-muted)]">
                      +{post.tags.length - 3}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {paginatedPosts.length === 0 && (
            <div className="rounded-lg border border-dashed border-[color:var(--border)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
              표시할 글이 없습니다.
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-[var(--text-muted)] transition hover:border-[color:var(--accent)] hover:text-[var(--text)] disabled:opacity-30"
          >
            이전
          </button>
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-[var(--text-muted)] transition hover:border-[color:var(--accent)] hover:text-[var(--text)] disabled:opacity-30"
          >
            다음
          </button>
        </div>
      )}
    </aside>
  );
};

export default AdminSidebar;

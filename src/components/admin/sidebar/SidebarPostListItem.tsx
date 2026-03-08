import type { Post } from '../../../data/blogData';
import { formatScheduleLabel } from '../../../utils/adminDate';
import { formatDate } from '../../../utils/formatDate';
import { getPostStatusLabel, normalizePostStatus } from '../../../utils/postStatus';

interface SidebarPostListItemProps {
  post: Post;
  selected: boolean;
  onSelect: (post: Post) => void;
}

export default function SidebarPostListItem({
  post,
  selected,
  onSelect
}: SidebarPostListItemProps) {
  const normalizedStatus = normalizePostStatus(post.status);
  const statusMeta = getPostStatusLabel(normalizedStatus);

  return (
    <button
      type="button"
      onClick={() => onSelect(post)}
      className={`group relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-all ${
        selected
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
              selected ? 'text-[var(--accent)]' : 'text-[var(--text)]'
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
}

import React from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '../data/blogData';
import { formatDate } from '../utils/formatDate';

interface PostCardProps {
  post: Post;
  variant?: 'featured' | 'compact';
  index?: number;
}

const PostCard: React.FC<PostCardProps> = ({ post, variant = 'compact', index = 0 }) => {
  const meta = `${formatDate(post.publishedAt)} | ${post.readingTime}`;
  const delay = `${index * 90}ms`;

  if (variant === 'featured') {
    return (
      <article
        className="group flex h-full flex-col gap-4 rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-strong)] animate-slide-up"
        style={{ animationDelay: delay }}
      >
        {post.cover && (
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src={post.cover}
              alt={post.title}
              className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <span className="absolute left-4 top-4 rounded-full bg-[var(--surface-strong)] px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)]">
              {post.category ?? '미분류'}
            </span>
          </div>
        )}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {meta}
          </p>
          <h3 className="font-display text-xl font-semibold text-[var(--text)]">
            {post.title}
          </h3>
          <p className="text-sm text-[var(--text-muted)]">{post.summary}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[color:var(--accent)] bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-medium text-[var(--accent-strong)]">
              {post.category ?? '미분류'}
            </span>
            {post.tags.map(tag => (
              <span
                key={tag}
                className="rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] text-[var(--text-muted)]"
              >
                #{tag}
              </span>
            ))}
          </div>
          <Link
            to={`/posts/${post.slug}`}
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-strong)]"
          >
            글 읽기
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article
      className="group flex flex-col gap-4 rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow)] md:flex-row animate-slide-up"
      style={{ animationDelay: delay }}
    >
      {post.cover && (
        <div className="overflow-hidden rounded-2xl md:h-32 md:w-48">
          <img
            src={post.cover}
            alt={post.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          {meta}
        </p>
        <div className="space-y-2">
          <h3 className="font-display text-lg font-semibold text-[var(--text)]">
            {post.title}
          </h3>
          <p className="text-sm text-[var(--text-muted)]">{post.summary}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[color:var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent-strong)]">
            {post.category ?? '미분류'}
          </span>
          {post.tags.map(tag => (
            <span
              key={tag}
              className="rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]"
            >
              #{tag}
            </span>
          ))}
          <Link
            to={`/posts/${post.slug}`}
            className="ml-auto text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-strong)]"
          >
            읽기
          </Link>
        </div>
      </div>
    </article>
  );
};

export default PostCard;

import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import PostContent from '../components/PostContent';
import PostCard from '../components/PostCard';
import { usePostStore } from '../store/postStore';
import { formatDate } from '../utils/formatDate';
import { isPostVisible } from '../utils/postStatus';
import { Comments } from '../components/Comments';

const PostPage: React.FC = () => {
  const { slug } = useParams();
  const posts = usePostStore(state => state.posts);
  const loading = usePostStore(state => state.loading);
  const error = usePostStore(state => state.error);
  const hasLoaded = usePostStore(state => state.hasLoaded);
  const fetchPosts = usePostStore(state => state.fetchPosts);
  const visiblePosts = posts.filter(post => isPostVisible(post));
  const post = visiblePosts.find(item => item.slug === slug);

  useEffect(() => {
    if (!hasLoaded && !loading) {
      void fetchPosts();
    }
  }, [hasLoaded, loading, fetchPosts]);

  useEffect(() => {
    if (!post || typeof document === 'undefined') return;
    const seoTitle = post.seo?.title ?? post.title;
    const seoDescription = post.seo?.description ?? post.summary;
    const seoImage = post.seo?.ogImage ?? post.cover ?? '';
    const seoKeywords = post.seo?.keywords?.join(', ') ?? '';
    const canonicalUrl = post.seo?.canonicalUrl ?? window.location.href;

    document.title = seoTitle;

    const setMetaTag = (key: string, content: string, attr: 'name' | 'property') => {
      const selector = `meta[${attr}="${key}"]`;
      let element = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!content) {
        if (element) element.remove();
        return;
      }
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const setLinkTag = (rel: string, href: string) => {
      const selector = `link[rel="${rel}"]`;
      let element = document.head.querySelector(selector) as HTMLLinkElement | null;
      if (!href) {
        if (element) element.remove();
        return;
      }
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    setMetaTag('description', seoDescription, 'name');
    setMetaTag('keywords', seoKeywords, 'name');
    setMetaTag('og:title', seoTitle, 'property');
    setMetaTag('og:description', seoDescription, 'property');
    setMetaTag('og:image', seoImage, 'property');
    setMetaTag('og:type', 'article', 'property');
    setMetaTag('og:url', canonicalUrl, 'property');
    setMetaTag('twitter:card', seoImage ? 'summary_large_image' : 'summary', 'name');
    setMetaTag('twitter:title', seoTitle, 'name');
    setMetaTag('twitter:description', seoDescription, 'name');
    setMetaTag('twitter:image', seoImage, 'name');
    setLinkTag('canonical', canonicalUrl);
  }, [post]);

  if (!hasLoaded && posts.length === 0) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen text-[var(--text)]">
          <div className="mx-auto max-w-3xl px-4 py-20">
            <LoadingSpinner message="글 불러오는 중..." />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (error && !post) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen text-[var(--text)]">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center">
            <p className="text-sm text-[var(--text-muted)]">{error}</p>
            <button
              type="button"
              onClick={() => fetchPosts()}
              className="mt-4 rounded-full border border-[color:var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text)]"
            >
              다시 시도
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (!post) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen text-[var(--text)]">
          <div className="mx-auto max-w-3xl px-4 py-20">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
              찾을 수 없음
            </p>
            <h1 className="mt-4 font-display text-3xl font-semibold">
              해당 글이 존재하지 않습니다.
            </h1>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              글 목록으로 돌아가세요.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]"
            >
              목록으로 돌아가기
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const morePosts = visiblePosts
    .filter(item => item.slug !== post.slug)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 2);

  return (
    <ErrorBoundary>
      <div className="min-h-screen text-[var(--text)]">
        <header className="border-b border-[color:var(--border)]">
          <div className="mx-auto max-w-3xl px-4 py-10">
            <Link
              to="/"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]"
            >
              목록으로 돌아가기
            </Link>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-4 text-base text-[var(--text-muted)]">
              {post.summary}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <span>{formatDate(post.publishedAt)}</span>
              <span>|</span>
              <span>{post.readingTime}</span>
              {post.series && (
                <>
                  <span>|</span>
                  <span>{post.series}</span>
                </>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
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
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-10">
          {post.cover && (
            <div className="mb-10 overflow-hidden rounded-3xl border border-[color:var(--border)] shadow-[var(--shadow)]">
              <img src={post.cover} alt={post.title} className="h-64 w-full object-cover sm:h-80" />
            </div>
          )}

          <PostContent sections={post.sections} contentHtml={post.contentHtml} />

          <Comments />

          {morePosts.length > 0 && (
            <section className="mt-16">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">다른 글</h2>
                <Link
                  to="/"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]"
                >
                  전체 보기
                </Link>
              </div>
              <div className="mt-6 grid gap-5">
                {morePosts.map((item, index) => (
                  <PostCard key={item.id} post={item} variant="compact" index={index} />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default PostPage;

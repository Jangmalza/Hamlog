import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, BookOpen, ChevronLeft } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import PostContent from '../components/PostContent';
import PostCard from '../components/PostCard';
import { usePostStore } from '../store/postStore';
import { formatDate } from '../utils/formatDate';
import { isPostVisible } from '../utils/postStatus';
import { Comments } from '../components/Comments';
import { CategorySidebar } from '../components/CategorySidebar';
import { fetchCategories } from '../api/categoryApi';
import type { Category } from '../types/category';
import { DEFAULT_CATEGORY } from '../utils/category';
import { buildCategoryTree } from '../utils/categoryTree';
import { useSeo } from '../hooks/useSeo';
import { useSchema } from '../hooks/useSchema';
import { TableOfContents } from '../components/TableOfContents';

const PostPage: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const posts = usePostStore(state => state.posts);
  const loading = usePostStore(state => state.loading);
  const error = usePostStore(state => state.error);
  const hasLoaded = usePostStore(state => state.hasLoaded);
  const fetchPosts = usePostStore(state => state.fetchPosts);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    if (!hasLoaded && !loading) {
      void fetchPosts();
    }
  }, [hasLoaded, loading, fetchPosts]);

  const visiblePosts = useMemo(() => posts.filter(post => isPostVisible(post)), [posts]);
  const post = useMemo(() => visiblePosts.find(item => item.slug === slug), [visiblePosts, slug]);

  const categoryTree = useMemo(
    () =>
      buildCategoryTree({
        categories,
        posts: visiblePosts,
        defaultCategory: DEFAULT_CATEGORY,
      }),
    [categories, visiblePosts]
  );

  useSeo({
    title: post?.seo?.title ?? post?.title,
    description: post?.seo?.description ?? post?.summary,
    image: post?.seo?.ogImage ?? post?.cover,
    keywords: post?.seo?.keywords,
    url: post?.seo?.canonicalUrl,
    type: 'article',
  });

  useSchema({ post });

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
        <div className="mx-auto max-w-7xl xl:max-w-[90rem] 2xl:max-w-[110rem] px-4 py-12 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] 2xl:grid-cols-[220px_minmax(0,1fr)_220px]">
          {/* Sidebar (Left): Categories */}
          <aside className="hidden lg:block relative">
            <div className="sticky top-8 space-y-8">
              <CategorySidebar
                categoryTree={categoryTree}
                selectedCategory={post.category ?? null}
                onSelectCategory={(category) => {
                  if (category) {
                    navigate(`/?category=${category}`);
                  } else {
                    navigate('/');
                  }
                }}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            <Link
              to="/"
              className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              메인화면으로 돌아가기
            </Link>

            <article>
              <header className="mb-10">
                <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.publishedAt)}
                  </span>
                  <span className="opacity-30">|</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {post.readingTime}
                  </span>
                  {post.series && (
                    <>
                      <span className="opacity-30">|</span>
                      <span className="inline-flex items-center gap-1.5 text-[var(--accent-strong)] font-medium">
                        <BookOpen className="h-4 w-4" />
                        {post.series}
                      </span>
                    </>
                  )}
                </div>

                <h1 className="mt-6 font-display text-3xl font-bold leading-loose text-[var(--text)] sm:text-4xl lg:text-5xl">
                  {post.title}
                </h1>

                <p className="mt-6 text-xl leading-relaxed text-[var(--text-muted)]">
                  {post.summary}
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-[color:var(--accent)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                    {post.category ?? '미분류'}
                  </span>
                  {post.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs text-[var(--text-muted)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </header>



              <div className="prose prose-lg max-w-none">
                <PostContent contentHtml={post.contentHtml} />
              </div>

              <hr className="my-12 border-[color:var(--border)]" />

              <Comments postId={post.id} />
            </article>

            {morePosts.length > 0 && (
              <section className="mt-20 border-t border-[color:var(--border)] pt-12">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-display text-2xl font-bold">다른 글 읽기</h2>
                  <Link
                    to="/"
                    className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
                  >
                    전체 보기 &rarr;
                  </Link>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {morePosts.map((item, index) => (
                    <PostCard key={item.id} post={item} variant="compact" index={index} />
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Sidebar (Right): TOC only */}
          <aside className="hidden 2xl:block relative">
            <div className="sticky top-8 space-y-8">
              <TableOfContents contentSelector=".prose" />
            </div>
          </aside>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default PostPage;

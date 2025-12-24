import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import PostCard from '../components/PostCard';
import { CategorySidebar } from '../components/CategorySidebar';
import { HomeHeader } from '../components/HomeHeader';
import { HomeFooter } from '../components/HomeFooter';

import { useSeo } from '../hooks/useSeo';
import { useHomeData } from '../hooks/useHomeData';
import { useHomePostFilter } from '../hooks/useHomePostFilter';

import { siteMeta } from '../data/blogData';

const HomePage = () => {
    // 1. Data Fetching Hook
    const {
        profile,
        managedCategories,
        posts,
        loading,
        error,
        fetchPosts,
        hasLoaded
    } = useHomeData();

    // 2. Filtering & Logic Hook
    const {
        selectedTag,
        setSelectedTag,
        selectedCategory,
        selectCategory,
        searchQuery,
        setSearchQuery,
        featuredPosts,
        filteredPosts,
        availableTags,
        seriesCount,
        categoryTree
    } = useHomePostFilter({ posts, managedCategories });

    // 3. SEO Hook
    useSeo({
        title: siteMeta.title,
        description: siteMeta.description,
        url: siteMeta.siteUrl,
        type: 'website'
    });

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
                <LoadingSpinner message="블로그 정보 불러오는 중..." />
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="min-h-screen text-[var(--text)]">
                <HomeHeader
                    profile={profile}
                    postCount={posts.length}
                    tagCount={availableTags.length}
                    categoryCount={categoryTree.allNames.length}
                    seriesCount={seriesCount}
                />

                <main>
                    {!hasLoaded && posts.length === 0 && (
                        <section className="mx-auto max-w-5xl px-4 py-12">
                            <LoadingSpinner message="글 불러오는 중..." />
                        </section>
                    )}

                    {error && posts.length === 0 && (
                        <section className="mx-auto max-w-5xl px-4 py-12">
                            <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow)]">
                                <p className="text-sm text-[var(--text-muted)]">{error}</p>
                                <button
                                    type="button"
                                    onClick={() => fetchPosts()}
                                    className="mt-4 rounded-full border border-[color:var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text)]"
                                >
                                    다시 시도
                                </button>
                            </div>
                        </section>
                    )}

                    {featuredPosts.length > 0 && (
                        <section id="spotlight" className="mx-auto max-w-5xl px-4 py-12">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <h2 className="mt-2 font-display text-2xl font-semibold">
                                        추천 글
                                    </h2>
                                </div>
                                <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                    {featuredPosts.length}편
                                </span>
                            </div>
                            <div className="mt-8 grid gap-6 md:grid-cols-2">
                                {featuredPosts.map((post, index) => (
                                    <PostCard key={post.id} post={post} variant="featured" index={index} />
                                ))}
                            </div>
                        </section>
                    )}

                    <section id="writing" className="mx-auto max-w-5xl px-4 py-12">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h2 className="mt-2 font-display text-2xl font-semibold">
                                    전체 글
                                </h2>
                            </div>
                            <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                {filteredPosts.length}편
                            </span>
                        </div>
                        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                            <CategorySidebar
                                categoryTree={categoryTree}
                                selectedCategory={selectedCategory}
                                onSelectCategory={selectCategory}
                            />

                            <div className="space-y-5">
                                {filteredPosts.length > 0 && (
                                    <div className="grid gap-5">
                                        {filteredPosts.map((post, index) => (
                                            <PostCard key={post.id} post={post} variant="compact" index={index} />
                                        ))}
                                    </div>
                                )}

                                {filteredPosts.length === 0 && hasLoaded && !loading && !error && (
                                    <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-8 text-center">
                                        <h3 className="font-display text-lg font-semibold">
                                            조건에 맞는 글이 없어요
                                        </h3>
                                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                                            태그를 바꾸거나 검색어를 지우고 다시 확인해 보세요.
                                        </p>
                                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                                            {selectedTag && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTag(null)}
                                                    className="rounded-full border border-[color:var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]"
                                                >
                                                    태그 해제
                                                </button>
                                            )}
                                            {selectedCategory && (
                                                <button
                                                    type="button"
                                                    onClick={() => selectCategory(null)}
                                                    className="rounded-full border border-[color:var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]"
                                                >
                                                    카테고리 해제
                                                </button>
                                            )}
                                            {searchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSearchQuery('')}
                                                    className="rounded-full border border-[color:var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]"
                                                >
                                                    검색 초기화
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </main>

                <HomeFooter profile={profile} />
            </div>
        </ErrorBoundary>
    );
};

export default HomePage;

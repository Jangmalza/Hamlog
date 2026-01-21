import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import { HomeHeader } from '../components/HomeHeader';
import { HomeFooter } from '../components/HomeFooter';
import { FeaturedSection } from '../components/home/FeaturedSection';
import { PostListSection } from '../components/home/PostListSection';

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
        title: profile.title,
        description: profile.description,
        url: siteMeta.siteUrl,
        type: 'website',
        favicon: profile.favicon
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

                    <FeaturedSection posts={featuredPosts} />

                    <PostListSection
                        filteredPosts={filteredPosts}
                        categoryTree={categoryTree}
                        selectedCategory={selectedCategory}
                        selectedTag={selectedTag}
                        searchQuery={searchQuery}
                        hasLoaded={hasLoaded}
                        loading={loading}
                        error={error}
                        onSelectCategory={selectCategory}
                        onClearTag={() => setSelectedTag(null)}
                        onClearSearch={() => setSearchQuery('')}
                    />
                </main>

                <HomeFooter profile={profile} />
            </div>
        </ErrorBoundary>
    );
};

export default HomePage;

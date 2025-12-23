import { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import PostCard from '../components/PostCard';
import { siteMeta } from '../data/blogData';
import { fetchCategories } from '../api/categoryApi';
import { fetchProfile } from '../api/profileApi';
import { usePostStore } from '../store/postStore';
import type { Category } from '../types/category';
import { DEFAULT_CATEGORY, normalizeCategoryKey } from '../utils/category';
import { buildCategoryTree, type CategoryNode } from '../utils/categoryTree';
import { isPostVisible } from '../utils/postStatus';
import { CategorySidebar } from '../components/CategorySidebar';
import { useSeo } from '../hooks/useSeo';

const NEW_BADGE_DAYS = 7;

const HomePage = () => {
    const [profile, setProfile] = useState(siteMeta);
    const [initialLoading, setInitialLoading] = useState(true);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [managedCategories, setManagedCategories] = useState<Category[]>([]);
    const posts = usePostStore(state => state.posts);
    const loading = usePostStore(state => state.loading);
    const error = usePostStore(state => state.error);
    const hasLoaded = usePostStore(state => state.hasLoaded);
    const fetchPosts = usePostStore(state => state.fetchPosts);

    useSeo({
        title: siteMeta.title,
        description: siteMeta.description,
        url: siteMeta.siteUrl,
        type: 'website'
    });

    useEffect(() => {
        if (!hasLoaded && !loading) {
            void fetchPosts();
        }
    }, [hasLoaded, loading, fetchPosts]);

    useEffect(() => {
        let isActive = true;
        const loadProfile = async () => {
            try {
                const nextProfile = await fetchProfile();
                if (isActive) {
                    setProfile(nextProfile);
                }
            } catch (error) {
                console.error('Failed to load profile', error);
            } finally {
                if (isActive) {
                    setInitialLoading(false);
                }
            }
        };
        void loadProfile();
        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        let isActive = true;
        const loadCategories = async () => {
            try {
                const list = await fetchCategories();
                if (isActive) {
                    setManagedCategories(list);
                }
            } catch (error) {
                console.error('Failed to load categories', error);
            }
        };
        void loadCategories();
        return () => {
            isActive = false;
        };
    }, []);

    const visiblePosts = useMemo(() => posts.filter(post => isPostVisible(post)), [posts]);

    const sortedPosts = useMemo(
        () =>
            [...visiblePosts].sort(
                (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            ),
        [visiblePosts]
    );

    const featuredPosts = useMemo(
        () => sortedPosts.filter(post => post.featured),
        [sortedPosts]
    );

    const seriesCount = useMemo(() => {
        const series = sortedPosts
            .map(post => post.series)
            .filter((value): value is string => Boolean(value));
        return new Set(series).size;
    }, [sortedPosts]);

    const availableTags = useMemo(() => {
        const tagSet = new Set<string>();
        sortedPosts.forEach(post => post.tags.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort();
    }, [sortedPosts]);

    const newSince = useMemo(
        () => Date.now() - NEW_BADGE_DAYS * 24 * 60 * 60 * 1000,
        []
    );

    const categoryTree = useMemo(
        () =>
            buildCategoryTree({
                categories: managedCategories,
                posts: visiblePosts,
                defaultCategory: DEFAULT_CATEGORY,
                newSince
            }),
        [managedCategories, visiblePosts, newSince]
    );

    const selectedCategoryKeys = useMemo(() => {
        if (!selectedCategory) return null;
        const key = normalizeCategoryKey(selectedCategory);
        const node = categoryTree.nodesByKey.get(key);
        const keys = new Set<string>();
        const collect = (target: CategoryNode) => {
            keys.add(normalizeCategoryKey(target.name));
            target.children.forEach(child => collect(child));
        };
        if (node) {
            collect(node);
        } else {
            keys.add(key);
        }
        return keys;
    }, [selectedCategory, categoryTree]);

    const filteredPosts = useMemo(() => {
        let result = sortedPosts;

        if (selectedCategoryKeys) {
            result = result.filter(post =>
                selectedCategoryKeys.has(
                    normalizeCategoryKey(post.category ?? DEFAULT_CATEGORY)
                )
            );
        }

        if (selectedTag) {
            result = result.filter(post => post.tags.includes(selectedTag));
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(post => {
                const fields = [
                    post.title,
                    post.summary,
                    post.series ?? '',
                    post.tags.join(' '),
                    post.category ?? ''
                ];
                return fields.some(text => text.toLowerCase().includes(q));
            });
        }

        return result;
    }, [sortedPosts, selectedCategoryKeys, selectedTag, searchQuery]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category');
        if (category) {
            setSelectedCategory(category);
        }
    }, []);



    if (initialLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
                <LoadingSpinner message="블로그 정보 불러오는 중..." />
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="min-h-screen text-[var(--text)]">
                <header className="border-b border-[color:var(--border)]">
                    <div className="mx-auto max-w-5xl px-4 py-10">
                        <nav className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                            <span className="font-display text-base font-semibold text-[var(--text)]">
                                {profile.title}
                            </span>

                        </nav>

                        <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
                            <div className="space-y-6">
                                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
                                    기술 저널
                                </p>
                                <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
                                    {profile.tagline}
                                </h1>
                                <p className="text-base text-[var(--text-muted)]">
                                    {profile.description}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <a
                                        href="#writing"
                                        className="rounded-full bg-[var(--accent)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[var(--shadow)] transition hover:-translate-y-0.5"
                                    >
                                        최신 글 보기
                                    </a>
                                    {profile.email && (
                                        <a
                                            href={`mailto:${profile.email}`}
                                            className="rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text)] transition hover:-translate-y-0.5"
                                        >
                                            메일 보내기
                                        </a>
                                    )}
                                </div>
                                <dl className="grid grid-cols-2 gap-4 text-xs text-[var(--text-muted)] sm:grid-cols-4">
                                    <div>
                                        <dt className="uppercase tracking-[0.2em]">글</dt>
                                        <dd className="mt-1 text-lg font-semibold text-[var(--text)]">
                                            {sortedPosts.length}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="uppercase tracking-[0.2em]">태그</dt>
                                        <dd className="mt-1 text-lg font-semibold text-[var(--text)]">
                                            {availableTags.length}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="uppercase tracking-[0.2em]">카테고리</dt>
                                        <dd className="mt-1 text-lg font-semibold text-[var(--text)]">
                                            {categoryTree.allNames.length}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="uppercase tracking-[0.2em]">시리즈</dt>
                                        <dd className="mt-1 text-lg font-semibold text-[var(--text)]">
                                            {seriesCount}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="space-y-6 rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
                                <div className="flex items-center gap-4">
                                    {profile.profileImage && (
                                        <img
                                            src={profile.profileImage}
                                            alt={`${profile.name} portrait`}
                                            className="h-16 w-16 rounded-2xl object-cover"
                                            loading="lazy"
                                        />
                                    )}
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                            작성자
                                        </p>
                                        <p className="font-display text-lg font-semibold">{profile.name}</p>
                                        <p className="text-sm text-[var(--text-muted)]">{profile.role}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                        지금
                                    </p>
                                    <p className="mt-2 text-sm text-[var(--text-muted)]">{profile.now}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                        주력 스택
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {profile.stack.map(item => (
                                            <span
                                                key={item}
                                                className="rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] text-[var(--text-muted)]"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-xs text-[var(--text-muted)]">
                                    {profile.location} 기반
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

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
                                onSelectCategory={(category) => {
                                    setSelectedCategory(category);
                                    const url = new URL(window.location.href);
                                    if (category) {
                                        url.searchParams.set('category', category);
                                    } else {
                                        url.searchParams.delete('category');
                                    }
                                    window.history.pushState({}, '', url.toString());
                                }}
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
                                                    onClick={() => setSelectedCategory(null)}
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

                <footer id="about" className="border-t border-[color:var(--border)]">
                    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
                                소개
                            </p>
                            <h2 className="mt-2 font-display text-xl font-semibold">{profile.title}</h2>
                            <p className="mt-2 text-sm text-[var(--text-muted)]">
                                {profile.description}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                            {profile.social.github && (
                                <a href={profile.social.github} target="_blank" rel="noreferrer">
                                    GitHub
                                </a>
                            )}
                            {profile.social.linkedin && (
                                <a href={profile.social.linkedin} target="_blank" rel="noreferrer">
                                    LinkedIn
                                </a>
                            )}
                            {profile.social.twitter && (
                                <a href={profile.social.twitter} target="_blank" rel="noreferrer">
                                    Twitter
                                </a>
                            )}
                            {profile.social.instagram && (
                                <a href={profile.social.instagram} target="_blank" rel="noreferrer">
                                    Instagram
                                </a>
                            )}
                            {profile.email && <a href={`mailto:${profile.email}`}>메일</a>}
                        </div>
                    </div>
                </footer>
            </div>
        </ErrorBoundary>
    );
};

export default HomePage;

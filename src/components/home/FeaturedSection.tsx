import PostCard from '../PostCard';
import type { Post } from '../../types/blog';

interface FeaturedSectionProps {
    posts: Post[];
}

export const FeaturedSection = ({ posts }: FeaturedSectionProps) => {
    if (posts.length === 0) return null;

    return (
        <section id="spotlight" className="mx-auto max-w-5xl px-4 py-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="mt-2 font-display text-2xl font-semibold">
                        추천 글
                    </h2>
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    {posts.length}편
                </span>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, index) => (
                    <PostCard key={post.id} post={post} variant="featured" index={index} />
                ))}
            </div>
        </section>
    );
};

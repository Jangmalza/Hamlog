import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type { SiteMeta } from '../types/blog';


interface HomeHeaderProps {
    profile: SiteMeta;
    postCount: number;
    tagCount: number;
    categoryCount: number;
    seriesCount: number;
}

export const HomeHeader = ({ profile, postCount, tagCount, categoryCount, seriesCount }: HomeHeaderProps) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="border-b border-[color:var(--border)]">
            <div className="mx-auto max-w-5xl px-4 py-10">
                <nav className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    <span className="font-display text-base font-semibold text-[var(--text)]">
                        {profile.title}
                    </span>
                    <button
                        onClick={toggleTheme}
                        className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
                        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark' ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
                    </button>
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
                                    {postCount}
                                </dd>
                            </div>
                            <div>
                                <dt className="uppercase tracking-[0.2em]">태그</dt>
                                <dd className="mt-1 text-lg font-semibold text-[var(--text)]">
                                    {tagCount}
                                </dd>
                            </div>
                            <div>
                                <dt className="uppercase tracking-[0.2em]">카테고리</dt>
                                <dd className="mt-1 text-lg font-semibold text-[var(--text)]">
                                    {categoryCount}
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
    );
};

import { useEffect, useState } from 'react';
import { Sun, Moon, Github, Linkedin, Mail, Twitter, Instagram, AtSign, Send } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type { SiteMeta } from '../types/blog';
import { trackVisitorStats, type VisitorStatsResponse } from '../api/visitorApi';


interface HomeHeaderProps {
    profile: SiteMeta;
    postCount: number;
    tagCount: number;
    categoryCount: number;
    seriesCount: number;
}

const compactNumber = new Intl.NumberFormat('ko-KR', {
    notation: 'compact',
    maximumFractionDigits: 1
});

const formatVisitorCount = (value: number) => (
    value >= 100000 ? compactNumber.format(value) : value.toLocaleString('ko-KR')
);

export const HomeHeader = ({ profile, postCount, tagCount, categoryCount, seriesCount }: HomeHeaderProps) => {
    const { theme, toggleTheme } = useTheme();
    const [visitorStats, setVisitorStats] = useState<VisitorStatsResponse | null>(null);
    const [visitorError, setVisitorError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadVisitorStats = async () => {
            try {
                const data = await trackVisitorStats();
                if (isMounted) {
                    setVisitorStats(data);
                }
            } catch {
                if (isMounted) {
                    setVisitorError(true);
                }
            }
        };

        void loadVisitorStats();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <header className="border-b border-[color:var(--border)]">
            <div className="mx-auto max-w-6xl px-4 py-10">
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
                    <div className="space-y-8">
                        <div>
                            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent)]">
                                기술 저널
                            </p>
                            <h1 className="break-keep font-display text-2xl font-bold leading-tight tracking-tight text-[var(--text)] sm:text-3xl lg:text-4xl">
                                {profile.tagline}
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-muted)] break-keep">
                                {profile.description}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <a
                                href="#writing"
                                className="group inline-flex items-center gap-2 rounded-full bg-[var(--text)] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--bg)] transition-all hover:bg-[var(--accent)] hover:scale-105 active:scale-95"
                            >
                                최신 글 읽기
                                <span className="transition-transform group-hover:translate-x-1">→</span>
                            </a>
                            {profile.email && (
                                <a
                                    href={`mailto:${profile.email}`}
                                    className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-transparent px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] transition-all hover:border-[var(--text)] hover:text-[var(--text)] active:scale-95"
                                >
                                    메일 보내기
                                </a>
                            )}
                        </div>

                        <div className="pt-4">
                            <dl className="grid grid-cols-4 gap-6 border-t border-[color:var(--border)] pt-6">
                                <div>
                                    <dt className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">Post</dt>
                                    <dd className="mt-1 font-display text-xl font-bold text-[var(--text)]">{postCount}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">Tag</dt>
                                    <dd className="mt-1 font-display text-xl font-bold text-[var(--text)]">{tagCount}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">Category</dt>
                                    <dd className="mt-1 font-display text-xl font-bold text-[var(--text)]">{categoryCount}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">Series</dt>
                                    <dd className="mt-1 font-display text-xl font-bold text-[var(--text)]">{seriesCount}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="space-y-4">
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

                            {/* Social Links */}
                            <div className="flex gap-3">
                                {profile.social.github && (
                                    <a
                                        href={profile.social.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                        aria-label="GitHub"
                                    >
                                        <Github size={18} />
                                    </a>
                                )}
                                {profile.social.linkedin && (
                                    <a
                                        href={profile.social.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                        aria-label="LinkedIn"
                                    >
                                        <Linkedin size={18} />
                                    </a>
                                )}
                                {profile.social.twitter && (
                                    <a
                                        href={profile.social.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                        aria-label="Twitter"
                                    >
                                        <Twitter size={18} />
                                    </a>
                                )}
                                {profile.social.instagram && (
                                    <a
                                        href={profile.social.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                        aria-label="Instagram"
                                    >
                                        <Instagram size={18} />
                                    </a>
                                )}
                                {profile.social.threads && (
                                    <a
                                        href={profile.social.threads}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                        aria-label="Threads"
                                    >
                                        <AtSign size={18} />
                                    </a>
                                )}
                                {profile.social.telegram && (
                                    <a
                                        href={profile.social.telegram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                        aria-label="Telegram"
                                    >
                                        <Send size={18} />
                                    </a>
                                )}
                                {profile.email && (
                                    <a
                                        href={`mailto:${profile.email}`}
                                        className="rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                        aria-label="Email"
                                    >
                                        <Mail size={18} />
                                    </a>
                                )}
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

                        <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] p-3 shadow-sm">
                            <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-1.5 text-[11px]">
                                <span className="whitespace-nowrap rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                                    방문자
                                </span>
                                <span className="flex min-w-0 items-center justify-between gap-1 rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 text-[var(--text-muted)]">
                                    <span className="text-[10px]">전체</span>
                                    <strong
                                        className="inline-block min-w-[3ch] text-right font-display text-sm tabular-nums text-[var(--text)]"
                                        title={visitorStats ? visitorStats.totalVisitors.toLocaleString('ko-KR') : '-'}
                                    >
                                        {visitorStats ? formatVisitorCount(visitorStats.totalVisitors) : '-'}
                                    </strong>
                                </span>
                                <span className="flex min-w-0 items-center justify-between gap-1 rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 text-[var(--text-muted)]">
                                    <span className="text-[10px]">오늘</span>
                                    <strong
                                        className="inline-block min-w-[3ch] text-right font-display text-sm tabular-nums text-[var(--text)]"
                                        title={visitorStats ? visitorStats.todayVisitors.toLocaleString('ko-KR') : '-'}
                                    >
                                        {visitorStats ? formatVisitorCount(visitorStats.todayVisitors) : '-'}
                                    </strong>
                                </span>
                            </div>
                            {visitorError && (
                                <p className="mt-1.5 text-[9px] text-[var(--text-muted)]">
                                    방문자 통계를 불러오지 못했습니다.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

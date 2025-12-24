import type { SiteMeta } from '../types/blog';

interface HomeFooterProps {
    profile: SiteMeta;
}

export const HomeFooter = ({ profile }: HomeFooterProps) => {
    return (
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
    );
};

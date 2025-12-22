import React from 'react';
import LoadingSpinner from '../../LoadingSpinner';
import type { SiteMeta } from '../../../data/blogData';

interface ProfileSectionProps {
  profileDraft: SiteMeta | null;
  stackInput: string;
  profileLoading: boolean;
  profileSaving: boolean;
  profileError: string;
  profileNotice: string;
  onProfileChange: <K extends keyof SiteMeta>(key: K, value: SiteMeta[K]) => void;
  onProfileSocialChange: (key: keyof SiteMeta['social'], value: string) => void;
  onStackInputChange: (value: string) => void;
  onSave: () => void;
  onReload: () => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  profileDraft,
  stackInput,
  profileLoading,
  profileSaving,
  profileError,
  profileNotice,
  onProfileChange,
  onProfileSocialChange,
  onStackInputChange,
  onSave,
  onReload
}) => (
  <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-lg font-semibold">자기소개 설정</h2>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {profileNotice && (
          <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] text-[var(--text-muted)]">
            {profileNotice}
          </span>
        )}
        {profileError && (
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] text-red-600">
            {profileError}
          </span>
        )}
      </div>
    </div>

    {profileLoading && !profileDraft ? (
      <div className="mt-4">
        <LoadingSpinner message="소개 불러오는 중..." />
      </div>
    ) : !profileDraft ? (
      <p className="mt-4 text-sm text-[var(--text-muted)]">
        소개 정보를 불러오지 못했습니다. 새로고침을 눌러 다시 시도하세요.
      </p>
    ) : (
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          블로그 이름
          <input
            value={profileDraft.title ?? ''}
            onChange={(event) => onProfileChange('title', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          태그라인
          <input
            value={profileDraft.tagline ?? ''}
            onChange={(event) => onProfileChange('tagline', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] md:col-span-2">
          소개 문장
          <textarea
            value={profileDraft.description ?? ''}
            onChange={(event) => onProfileChange('description', event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          이름
          <input
            value={profileDraft.name ?? ''}
            onChange={(event) => onProfileChange('name', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          역할
          <input
            value={profileDraft.role ?? ''}
            onChange={(event) => onProfileChange('role', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          위치
          <input
            value={profileDraft.location ?? ''}
            onChange={(event) => onProfileChange('location', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          이메일
          <input
            value={profileDraft.email ?? ''}
            onChange={(event) => onProfileChange('email', event.target.value)}
            placeholder="hello@example.com"
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] md:col-span-2">
          프로필 이미지 URL
          <input
            value={profileDraft.profileImage ?? ''}
            onChange={(event) => onProfileChange('profileImage', event.target.value)}
            placeholder="/avatar.jpg 또는 https://..."
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] md:col-span-2">
          지금 하고 있는 일
          <input
            value={profileDraft.now ?? ''}
            onChange={(event) => onProfileChange('now', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] md:col-span-2">
          기술 스택
          <input
            value={stackInput}
            onChange={(event) => onStackInputChange(event.target.value)}
            placeholder="React, TypeScript, Vite"
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
          <span className="mt-2 block text-[11px] text-[var(--text-muted)]">
            쉼표로 구분해서 입력하세요.
          </span>
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          GitHub
          <input
            value={profileDraft.social.github ?? ''}
            onChange={(event) => onProfileSocialChange('github', event.target.value)}
            placeholder="https://github.com/..."
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          LinkedIn
          <input
            value={profileDraft.social.linkedin ?? ''}
            onChange={(event) => onProfileSocialChange('linkedin', event.target.value)}
            placeholder="https://linkedin.com/in/..."
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Twitter
          <input
            value={profileDraft.social.twitter ?? ''}
            onChange={(event) => onProfileSocialChange('twitter', event.target.value)}
            placeholder="https://twitter.com/..."
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Instagram
          <input
            value={profileDraft.social.instagram ?? ''}
            onChange={(event) => onProfileSocialChange('instagram', event.target.value)}
            placeholder="https://instagram.com/..."
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
          />
        </label>
      </div>
    )}

    <div className="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onSave}
        disabled={profileSaving || !profileDraft}
        className="rounded-full bg-[var(--accent)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {profileSaving ? '저장 중...' : '소개 저장'}
      </button>
      <button
        type="button"
        onClick={onReload}
        disabled={profileSaving || profileLoading}
        className="rounded-full border border-[color:var(--border)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        되돌리기
      </button>
    </div>
  </div>
);

export default ProfileSection;

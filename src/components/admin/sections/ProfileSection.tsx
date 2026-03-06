import React, { useMemo, useRef, useState } from 'react';
import {
  AtSign,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  Github,
  Globe,
  ImagePlus,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Twitter,
  UserRound,
  X,
  type LucideIcon
} from 'lucide-react';
import LoadingSpinner from '../../LoadingSpinner';
import type { SiteMeta } from '../../../data/blogData';
import { uploadLocalImage } from '../../../api/uploadApi';

interface ProfileSectionProps {
  profileDraft: SiteMeta | null;
  profileLoading: boolean;
  profileSaving: boolean;
  profileError: string;
  profileNotice: string;
  onProfileChange: <K extends keyof SiteMeta>(key: K, value: SiteMeta[K]) => void;
  onProfileSocialChange: (key: keyof SiteMeta['social'], value: string) => void;
  onSave: () => void;
  onReload: () => void;
}

interface SectionCardProps {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

interface FieldProps {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

const inputClassName =
  'mt-2 w-full rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20';

const textareaClassName = `${inputClassName} resize-y`;

const SOCIAL_FIELDS: Array<{
  key: keyof SiteMeta['social'];
  label: string;
  placeholder: string;
  icon: LucideIcon;
}> = [
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/...', icon: Github },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...', icon: Linkedin },
  { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/...', icon: Twitter },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...', icon: Instagram },
  { key: 'threads', label: 'Threads', placeholder: 'https://threads.net/...', icon: AtSign },
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/...', icon: Send }
];

const DISPLAY_FIELDS: Array<{
  key: keyof SiteMeta['display'];
  label: string;
  description: string;
}> = [
  { key: 'showProfileImage', label: '프로필 이미지', description: '작성자 카드의 프로필 이미지를 노출합니다.' },
  { key: 'showSocialLinks', label: '소셜 링크', description: 'GitHub, LinkedIn, Threads 같은 외부 링크를 노출합니다.' },
  { key: 'showEmail', label: '이메일', description: '메일 버튼과 메일 링크를 노출합니다.' },
  { key: 'showNow', label: '지금', description: '최근 관심사나 진행 중인 일을 보여줍니다.' },
  { key: 'showStack', label: '주력 스택', description: '기술 스택 태그 영역을 노출합니다.' },
  { key: 'showLocation', label: '로케이션', description: '위치 정보와 기반 문구를 노출합니다.' }
];

const SectionCard = ({ eyebrow, title, description, className = '', children }: SectionCardProps) => (
  <section
    className={`rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] ${className}`}
  >
    <div className="mb-5 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
        {eyebrow}
      </p>
      <div>
        <h3 className="font-display text-xl font-semibold text-[var(--text)]">{title}</h3>
        {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
      </div>
    </div>
    {children}
  </section>
);

const Field = ({ label, hint, className = '', children }: FieldProps) => (
  <label className={`block text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] ${className}`}>
    <span>{label}</span>
    {hint && <span className="mt-1 block text-[11px] normal-case tracking-normal">{hint}</span>}
    {children}
  </label>
);

const ProfileSection: React.FC<ProfileSectionProps> = ({
  profileDraft,
  profileLoading,
  profileSaving,
  profileError,
  profileNotice,
  onProfileChange,
  onProfileSocialChange,
  onSave,
  onReload
}) => {
  const [uploading, setUploading] = useState(false);
  const [stackInputValue, setStackInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'profileImage' | 'favicon') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const { url } = await uploadLocalImage(file);
      onProfileChange(field, url);
    } catch (error) {
      console.error('Failed to upload image', error);
      alert(field === 'favicon' ? '파비콘 업로드에 실패했습니다.' : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleStackKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!profileDraft) return;

    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const nextTag = stackInputValue.trim();
      if (nextTag && !profileDraft.stack.includes(nextTag)) {
        onProfileChange('stack', [...profileDraft.stack, nextTag]);
        setStackInputValue('');
      }
      return;
    }

    if (event.key === 'Backspace' && !stackInputValue && profileDraft.stack.length > 0) {
      const nextStack = [...profileDraft.stack];
      nextStack.pop();
      onProfileChange('stack', nextStack);
    }
  };

  const removeStackTag = (tagToRemove: string) => {
    if (!profileDraft) return;
    onProfileChange(
      'stack',
      profileDraft.stack.filter(tag => tag !== tagToRemove)
    );
  };

  const handleDisplayToggle = (key: keyof SiteMeta['display']) => {
    if (!profileDraft) return;
    onProfileChange('display', {
      ...profileDraft.display,
      [key]: !profileDraft.display[key]
    });
  };

  const profileStats = useMemo(() => {
    if (!profileDraft) {
      return {
        completionRate: 0,
        completedBaseFields: 0,
        totalBaseFields: 9,
        socialCount: 0,
        assetCount: 0
      };
    }

    const baseFields = [
      profileDraft.title,
      profileDraft.tagline,
      profileDraft.description,
      profileDraft.name,
      profileDraft.role,
      profileDraft.location,
      profileDraft.email,
      profileDraft.profileImage,
      profileDraft.now
    ];
    const completedBaseFields = baseFields.filter(value => String(value ?? '').trim()).length;
    const socialCount = Object.values(profileDraft.social ?? {}).filter(value => String(value ?? '').trim()).length;
    const assetCount = [profileDraft.profileImage, profileDraft.favicon].filter(value => String(value ?? '').trim()).length;

    return {
      completionRate: Math.round((completedBaseFields / baseFields.length) * 100),
      completedBaseFields,
      totalBaseFields: baseFields.length,
      socialCount,
      assetCount
    };
  }, [profileDraft]);

  const socialPreviewItems = useMemo(() => {
    if (!profileDraft) return [];

    return SOCIAL_FIELDS.filter(({ key }) => String(profileDraft.social?.[key] ?? '').trim()).map(({ key, label, icon }) => ({
      key,
      label,
      icon
    }));
  }, [profileDraft]);

  const identityFallback = useMemo(() => {
    const trimmedName = profileDraft?.name?.trim() ?? '';
    if (!trimmedName) return 'ME';
    return trimmedName
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0] ?? '')
      .join('')
      .toUpperCase();
  }, [profileDraft?.name]);

  if (profileLoading && !profileDraft) {
    return (
      <div className="rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow)]">
        <LoadingSpinner message="소개 정보를 불러오는 중..." />
      </div>
    );
  }

  if (!profileDraft) {
    return (
      <div className="rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow)]">
        <p className="text-sm text-[var(--text-muted)]">
          소개 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.
        </p>
        <button
          type="button"
          onClick={onReload}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[color:var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)] transition hover:border-[color:var(--accent)] hover:text-[var(--accent-strong)]"
        >
          <RefreshCw size={14} />
          다시 불러오기
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
        <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="border-b border-[color:var(--border)] bg-[radial-gradient(circle_at_top_left,rgba(19,144,116,0.18),transparent_48%),linear-gradient(180deg,var(--surface-muted),var(--surface))] px-6 py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
              라이브 미리보기
            </p>
            <div className="mt-4 flex items-start gap-4">
              {profileDraft.display.showProfileImage && profileDraft.profileImage ? (
                <img
                  src={profileDraft.profileImage}
                  alt={`${profileDraft.name || profileDraft.title} 프로필 이미지`}
                  className="h-20 w-20 rounded-lg border border-white/40 object-cover shadow-[0_18px_40px_-24px_rgba(11,35,32,0.8)]"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-[color:var(--border)] bg-[var(--surface)] font-display text-lg font-semibold text-[var(--text-muted)]">
                  {identityFallback}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {profileDraft.title || '블로그 제목'}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-[var(--text)]">
                  {profileDraft.name || '이름을 입력하세요'}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {profileDraft.role || '역할을 입력하면 여기에서 바로 보입니다.'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {profileDraft.display.showLocation && profileDraft.location && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-[var(--surface)]/80 px-3 py-1 text-[11px] text-[var(--text-muted)]">
                  <MapPin size={12} />
                  {profileDraft.location}
                </span>
              )}
              {profileDraft.display.showEmail && profileDraft.email && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-[var(--surface)]/80 px-3 py-1 text-[11px] text-[var(--text-muted)]">
                  <Mail size={12} />
                  {profileDraft.email}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                카피
              </p>
              <p className="mt-2 font-display text-xl font-semibold leading-snug text-[var(--text)]">
                {profileDraft.tagline || '태그라인을 입력해 홈 헤더의 첫 인상을 정리하세요.'}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                {profileDraft.description || '소개 문장은 방문자에게 무엇을 쓰는 블로그인지 빠르게 설명해 줍니다.'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                <span>완성도</span>
                <span>{profileStats.completionRate}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-sm bg-[var(--surface-muted)]">
                <div
                  className="h-full rounded-sm bg-[var(--accent)] transition-all"
                  style={{ width: `${profileStats.completionRate}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-3">
                  <p className="font-display text-lg font-semibold text-[var(--text)]">
                    {profileStats.completedBaseFields}/{profileStats.totalBaseFields}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    기본 정보
                  </p>
                </div>
                <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-3">
                  <p className="font-display text-lg font-semibold text-[var(--text)]">
                    {profileDraft.stack.length}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    스택
                  </p>
                </div>
                <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-3">
                  <p className="font-display text-lg font-semibold text-[var(--text)]">
                    {profileStats.socialCount}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    소셜
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {profileDraft.display.showNow && (
              <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  <Sparkles size={14} />
                  지금
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--text)]">
                  {profileDraft.now || '현재 집중하고 있는 일이나 관심사를 적어 보세요.'}
                </p>
              </div>
              )}
              <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  <ImagePlus size={14} />
                  자산
                </div>
                <p className="mt-3 text-sm text-[var(--text)]">
                  프로필/파비콘 {profileStats.assetCount}/2 설정됨
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                연결된 채널
              </p>
              {profileDraft.display.showSocialLinks && socialPreviewItems.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {socialPreviewItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <span
                        key={item.key}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] text-[var(--text-muted)]"
                      >
                        <Icon size={12} />
                        {item.label}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  {profileDraft.display.showSocialLinks
                    ? '아직 연결된 외부 채널이 없습니다.'
                    : '소셜 링크 노출이 꺼져 있습니다.'}
                </p>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                주력 스택
              </p>
              {profileDraft.display.showStack && profileDraft.stack.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profileDraft.stack.map(item => (
                    <span
                      key={item}
                      className="rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] text-[var(--text-muted)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  {profileDraft.display.showStack
                    ? '스택 태그를 추가하면 소개 카드와 홈 헤더에 노출할 준비가 됩니다.'
                    : '주력 스택 노출이 꺼져 있습니다.'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            작성 팁
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-muted)]">
            <li>태그라인은 방문자가 첫 5초 안에 이해할 수 있는 한 문장으로 유지하는 편이 좋습니다.</li>
            <li>`지금` 필드는 최신 관심사나 진행 중인 프로젝트를 적으면 홈 화면이 덜 정적으로 보입니다.</li>
            <li>소셜 링크는 많이 넣기보다 실제로 응답 가능한 채널 위주로 남기는 게 좋습니다.</li>
          </ul>
        </div>
      </aside>

      <div className="space-y-6">
        <div className="rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                자기소개 워크스페이스
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--text)]">
                방문자가 보는 소개와 브랜드 정보를 한 번에 관리합니다.
              </h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                홈 헤더와 소개 영역에 바로 반영되는 핵심 정보만 모아 놓았습니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {profileNotice && (
                <span className="rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] text-[var(--text-muted)]">
                  {profileNotice}
                </span>
              )}
              {profileError && (
                <span className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-[11px] text-red-600">
                  {profileError}
                </span>
              )}
              <button
                type="button"
                onClick={onReload}
                disabled={profileSaving || profileLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)] transition hover:border-[color:var(--accent)] hover:text-[var(--accent-strong)] disabled:opacity-50"
              >
                <RefreshCw size={14} />
                되돌리기
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={profileSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--text)] px-4 py-2 text-xs font-semibold text-[var(--bg)] transition hover:opacity-90 disabled:opacity-50"
              >
                <Save size={14} />
                {profileSaving ? '저장 중...' : '소개 저장'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            eyebrow="브랜드"
            title="블로그 첫 인상"
            description="홈 상단과 SEO 기본값에 연결되는 제목과 카피를 정리합니다."
          >
            <div className="space-y-4">
              <Field label="블로그 이름">
                <input
                  value={profileDraft.title ?? ''}
                  onChange={event => onProfileChange('title', event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="태그라인" hint="홈 헤더에서 가장 크게 노출됩니다.">
                <input
                  value={profileDraft.tagline ?? ''}
                  onChange={event => onProfileChange('tagline', event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="소개 문장" hint="블로그 성격을 설명하는 짧은 설명입니다.">
                <textarea
                  value={profileDraft.description ?? ''}
                  onChange={event => onProfileChange('description', event.target.value)}
                  rows={5}
                  className={textareaClassName}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="정체성"
            title="작성자 정보"
            description="이름, 역할, 연락처 등 프로필 카드에 노출되는 기본 정보를 구성합니다."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="이름">
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={profileDraft.name ?? ''}
                    onChange={event => onProfileChange('name', event.target.value)}
                    className={`${inputClassName} pl-11`}
                  />
                </div>
              </Field>
              <Field label="역할">
                <div className="relative">
                  <BriefcaseBusiness className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={profileDraft.role ?? ''}
                    onChange={event => onProfileChange('role', event.target.value)}
                    className={`${inputClassName} pl-11`}
                  />
                </div>
              </Field>
              <Field label="위치">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={profileDraft.location ?? ''}
                    onChange={event => onProfileChange('location', event.target.value)}
                    className={`${inputClassName} pl-11`}
                  />
                </div>
              </Field>
              <Field label="이메일">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={profileDraft.email ?? ''}
                    onChange={event => onProfileChange('email', event.target.value)}
                    placeholder="hello@example.com"
                    className={`${inputClassName} pl-11`}
                  />
                </div>
              </Field>
              <Field
                label="지금 하고 있는 일"
                hint="최근 관심사나 진행 중인 일을 적으면 소개 카드가 더 살아납니다."
                className="sm:col-span-2"
              >
                <textarea
                  value={profileDraft.now ?? ''}
                  onChange={event => onProfileChange('now', event.target.value)}
                  rows={4}
                  className={textareaClassName}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="노출 제어"
            title="자기소개 요소 표시 설정"
            description="홈 헤더와 소개 영역에서 어떤 요소를 보여줄지 토글로 제어합니다."
          >
            <div className="space-y-3">
              {DISPLAY_FIELDS.map(field => {
                const enabled = profileDraft.display[field.key];
                return (
                  <div
                    key={field.key}
                    className="flex items-center justify-between gap-4 rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)]">{field.label}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{field.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDisplayToggle(field.key)}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        enabled
                          ? 'bg-[var(--text)] text-[var(--bg)]'
                          : 'border border-[color:var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
                      }`}
                    >
                      {enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                      {enabled ? '노출 중' : '숨김'}
                    </button>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="이미지"
            title="프로필 자산"
            description="프로필 이미지와 브라우저 탭에 쓰는 파비콘을 함께 관리합니다."
          >
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-[84px_minmax(0,1fr)] sm:items-start">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)]">
                  {profileDraft.profileImage ? (
                    <img src={profileDraft.profileImage} alt="프로필 미리보기" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus size={20} className="text-[var(--text-muted)]" />
                  )}
                </div>
                <Field label="프로필 이미지 URL" hint="/avatar.jpg 또는 외부 이미지 주소를 사용할 수 있습니다.">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={profileDraft.profileImage ?? ''}
                      onChange={event => onProfileChange('profileImage', event.target.value)}
                      placeholder="/avatar.jpg 또는 https://..."
                      className={`${inputClassName} mt-0 flex-1`}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={event => void handleImageUpload(event, 'profileImage')}
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text)] transition hover:border-[color:var(--accent)] hover:text-[var(--accent-strong)] disabled:opacity-50"
                    >
                      {uploading ? '업로드 중' : '이미지 업로드'}
                    </button>
                  </div>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-[84px_minmax(0,1fr)] sm:items-start">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)]">
                  {profileDraft.favicon ? (
                    <img src={profileDraft.favicon} alt="파비콘 미리보기" className="h-10 w-10 rounded-xl object-cover" />
                  ) : (
                    <Globe size={20} className="text-[var(--text-muted)]" />
                  )}
                </div>
                <Field label="파비콘 URL" hint="브라우저 탭과 공유 링크에 쓰이는 기본 아이콘입니다.">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={profileDraft.favicon ?? ''}
                      onChange={event => onProfileChange('favicon', event.target.value)}
                      placeholder="/avatar.jpg 또는 https://..."
                      className={`${inputClassName} mt-0 flex-1`}
                    />
                    <input
                      ref={faviconInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={event => void handleImageUpload(event, 'favicon')}
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => faviconInputRef.current?.click()}
                      className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text)] transition hover:border-[color:var(--accent)] hover:text-[var(--accent-strong)] disabled:opacity-50"
                    >
                      {uploading ? '업로드 중' : '파비콘 업로드'}
                    </button>
                  </div>
                </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="노출 포인트"
            title="주력 스택"
            description="홈 소개 카드에 노출할 태그를 관리합니다. 엔터나 쉼표로 빠르게 추가할 수 있습니다."
            className="lg:col-span-2"
          >
            <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                {profileDraft.stack.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text)]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeStackTag(tag)}
                      className="rounded-md p-0.5 text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  value={stackInputValue}
                  onChange={event => setStackInputValue(event.target.value)}
                  onKeyDown={handleStackKeyDown}
                  placeholder={profileDraft.stack.length ? '스택 추가' : 'React, TypeScript, AWS...'}
                  className="min-w-[200px] flex-1 bg-transparent px-1 py-2 text-sm text-[var(--text)] outline-none"
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              현재 {profileDraft.stack.length}개의 스택 태그가 등록되어 있습니다.
            </p>
          </SectionCard>

          <SectionCard
            eyebrow="연결 채널"
            title="소셜 링크"
            description="실제로 응답 가능한 채널 위주로 연결해 두는 편이 운영에 유리합니다."
            className="lg:col-span-2"
          >
            <div className="grid gap-4 md:grid-cols-2">
              {SOCIAL_FIELDS.map(({ key, label, placeholder, icon: Icon }) => (
                <Field key={key} label={label}>
                  <div className="relative">
                    <Icon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      value={profileDraft.social[key] ?? ''}
                      onChange={event => onProfileSocialChange(key, event.target.value)}
                      placeholder={placeholder}
                      className={`${inputClassName} pl-11`}
                    />
                  </div>
                </Field>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;

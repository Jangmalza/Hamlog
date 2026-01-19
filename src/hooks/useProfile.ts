import { useCallback, useState } from 'react';
import { fetchProfile, updateProfile } from '../api/profileApi';
import type { SiteMeta } from '../data/blogData';

const formatStackInput = (stack: string[]) => stack.join(', ');

const parseStackInput = (value: string) =>
  value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

const normalizeProfileDraft = (profile: SiteMeta): SiteMeta => ({
  ...profile,
  social: {
    github: profile.social?.github ?? '',
    linkedin: profile.social?.linkedin ?? '',
    twitter: profile.social?.twitter ?? '',
    instagram: profile.social?.instagram ?? '',
    threads: profile.social?.threads ?? '',
    telegram: profile.social?.telegram ?? ''
  }
});

export const useProfile = () => {
  const [profileDraft, setProfileDraft] = useState<SiteMeta | null>(null);
  const [stackInput, setStackInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const profile = await fetchProfile();
      const normalized = normalizeProfileDraft(profile);
      setProfileDraft(normalized);
      setStackInput(formatStackInput(normalized.stack));
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : '소개 정보를 불러오지 못했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfileField = useCallback(
    <K extends keyof SiteMeta>(key: K, value: SiteMeta[K]) => {
      setProfileDraft(prev => (prev ? { ...prev, [key]: value } : prev));
    },
    []
  );

  const updateProfileSocial = useCallback(
    (key: keyof SiteMeta['social'], value: string) => {
      setProfileDraft(prev =>
        prev ? { ...prev, social: { ...prev.social, [key]: value } } : prev
      );
    },
    []
  );

  const saveProfile = useCallback(async () => {
    if (!profileDraft || saving) return;
    const requiredFields = [
      { key: 'title', label: '블로그 이름' },
      { key: 'name', label: '이름' },
      { key: 'role', label: '역할' },
      { key: 'description', label: '소개 문장' }
    ] as const;
    for (const field of requiredFields) {
      const value = String(profileDraft[field.key] ?? '').trim();
      if (!value) {
        setError(`${field.label}을(를) 입력하세요.`);
        return;
      }
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload: SiteMeta = {
        ...profileDraft,
        title: profileDraft.title.trim(),
        name: profileDraft.name.trim(),
        role: profileDraft.role.trim(),
        tagline: profileDraft.tagline.trim(),
        description: profileDraft.description.trim(),
        location: profileDraft.location.trim(),
        profileImage: profileDraft.profileImage.trim(),
        email: profileDraft.email.trim(),
        now: profileDraft.now.trim(),
        stack: parseStackInput(stackInput),
        social: {
          github: profileDraft.social.github?.trim() ?? '',
          linkedin: profileDraft.social.linkedin?.trim() ?? '',
          twitter: profileDraft.social.twitter?.trim() ?? '',
          instagram: profileDraft.social.instagram?.trim() ?? '',
          threads: profileDraft.social.threads?.trim() ?? '',
          telegram: profileDraft.social.telegram?.trim() ?? ''
        }
      };
      const saved = await updateProfile(payload);
      const normalized = normalizeProfileDraft(saved);
      setProfileDraft(normalized);
      setStackInput(formatStackInput(normalized.stack));
      setNotice('자기소개 정보가 저장되었습니다.');
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : '저장에 실패했습니다.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [profileDraft, saving, stackInput]);

  return {
    profileDraft,
    setProfileDraft,
    stackInput,
    setStackInput,
    loading,
    saving,
    error,
    notice,
    loadProfile,
    saveProfile,
    updateProfileField,
    updateProfileSocial
  };
};

import type { LucideIcon } from 'lucide-react';
import type { SiteMeta } from '../../../data/blogData';

export type ProfileChangeHandler = <K extends keyof SiteMeta>(key: K, value: SiteMeta[K]) => void;
export type ProfileSocialChangeHandler = (key: keyof SiteMeta['social'], value: string) => void;

export interface ProfileSectionProps {
  profileDraft: SiteMeta | null;
  profileLoading: boolean;
  profileSaving: boolean;
  profileError: string;
  profileNotice: string;
  onProfileChange: ProfileChangeHandler;
  onProfileSocialChange: ProfileSocialChangeHandler;
  onSave: () => void;
  onReload: () => void;
}

export interface ProfileStats {
  completionRate: number;
  completedBaseFields: number;
  totalBaseFields: number;
  socialCount: number;
  assetCount: number;
}

export interface SocialPreviewItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

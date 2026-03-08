import {
  AtSign,
  Github,
  Instagram,
  Linkedin,
  Send,
  Twitter,
  type LucideIcon
} from 'lucide-react';
import type { SiteMeta } from '../../../data/blogData';

export interface SocialFieldConfig {
  key: keyof SiteMeta['social'];
  label: string;
  placeholder: string;
  icon: LucideIcon;
}

export interface DisplayFieldConfig {
  key: keyof SiteMeta['display'];
  label: string;
  description: string;
}

export const SOCIAL_FIELDS: SocialFieldConfig[] = [
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/...', icon: Github },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...', icon: Linkedin },
  { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/...', icon: Twitter },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...', icon: Instagram },
  { key: 'threads', label: 'Threads', placeholder: 'https://threads.net/...', icon: AtSign },
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/...', icon: Send }
];

export const DISPLAY_FIELDS: DisplayFieldConfig[] = [
  { key: 'showProfileImage', label: '프로필 이미지', description: '작성자 카드의 프로필 이미지를 노출합니다.' },
  { key: 'showSocialLinks', label: '소셜 링크', description: 'GitHub, LinkedIn, Threads 같은 외부 링크를 노출합니다.' },
  { key: 'showEmail', label: '이메일', description: '메일 버튼과 메일 링크를 노출합니다.' },
  { key: 'showNow', label: '지금', description: '최근 관심사나 진행 중인 일을 보여줍니다.' },
  { key: 'showStack', label: '주력 스택', description: '기술 스택 태그 영역을 노출합니다.' },
  { key: 'showLocation', label: '로케이션', description: '위치 정보와 기반 문구를 노출합니다.' }
];

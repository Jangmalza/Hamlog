import type { SiteMeta, TopicHighlight } from '../types/blog';

export * from '../types/blog';

export const siteMeta: SiteMeta = {
  title: 'Ham_Tech_Log',
  name: 'Author Name',
  role: 'Role',
  tagline: 'Tagline',
  description: '개인적으로 경험하고 탐구하고 학습했던 내용들을 기록하는 블로그입니다.',
  location: 'Location',
  profileImage: '/avatar.jpg',
  favicon: '/avatar.jpg',
  email: '',
  siteUrl: 'https://tech.hamwoo.co.kr',
  social: {
    github: '',
    linkedin: '',
    twitter: '',
    instagram: ''
  },
  stack: [],
  now: ''
};

export const topicHighlights: TopicHighlight[] = [];

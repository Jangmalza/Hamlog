export interface SiteMeta {
  title: string;
  name: string;
  role: string;
  tagline: string;
  description: string;
  location: string;
  profileImage: string;
  email: string;
  social: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  stack: string[];
  now: string;
}

export const siteMeta: SiteMeta = {
  title: 'Hamlog',
  name: 'Hamwoo',
  role: '프론트엔드 엔지니어',
  tagline: '탄탄한 UI와 제품 경험을 만들어가는 기록.',
  description:
    '프론트엔드 아키텍처, 사용자 경험, 실용적인 도구 선택에 대한 짧고 명확한 노트를 남깁니다.',
  location: '서울',
  profileImage: '/avatar.jpg',
  email: 'hello@hamlog.dev',
  social: {
    github: 'https://github.com/Jangmalza',
    instagram: 'https://www.instagram.com/hamwo_o/'
  },
  stack: ['React', 'TypeScript', 'Vite', 'Node.js', 'Tailwind'],
  now: '로컬 퍼스트 글쓰기 워크플로우와 작은 퍼블리싱 파이프라인을 다듬는 중입니다.'
};

export interface TopicHighlight {
  title: string;
  description: string;
}

export const topicHighlights: TopicHighlight[] = [
  {
    title: 'UI 시스템',
    description: '확장 가능한 컬러, 타이포, 레이아웃 토큰 설계를 정리합니다.'
  },
  {
    title: '제품 전달',
    description: '작은 릴리즈와 성능 예산을 지키는 제작 흐름을 공유합니다.'
  },
  {
    title: '관측성',
    description: '방해 없이 도움이 되는 로깅과 디버깅 도구를 다룹니다.'
  }
];

export type PostSection =
  | { type: 'heading'; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'list'; content: string[] }
  | { type: 'code'; content: string; language?: string }
  | { type: 'quote'; content: string }
  | { type: 'callout'; content: string }
  | { type: 'image'; content: string; alt?: string; caption?: string };

export type PostStatus = 'draft' | 'scheduled' | 'published';

export interface PostSeo {
  title?: string;
  description?: string;
  ogImage?: string;
  canonicalUrl?: string;
  keywords?: string[];
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category?: string;
  contentHtml?: string;
  publishedAt: string;
  readingTime: string;
  tags: string[];
  series?: string;
  featured?: boolean;
  cover?: string;
  status?: PostStatus;
  scheduledAt?: string;
  seo?: PostSeo;
  sections: PostSection[];
}

export type PostInput = Omit<Post, 'id'>;

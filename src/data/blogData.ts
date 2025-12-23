import type { SiteMeta, TopicHighlight } from '../types/blog';

export * from '../types/blog';

export const siteMeta: SiteMeta = {
  title: 'Blog Title',
  name: 'Author Name',
  role: 'Role',
  tagline: 'Tagline',
  description: 'Description',
  location: 'Location',
  profileImage: '',
  email: '',
  siteUrl: 'http://localhost:5173',
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

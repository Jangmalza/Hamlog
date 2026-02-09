import React from 'react';
import DOMPurify from 'dompurify';
interface PostContentProps {
  contentHtml?: string;
}

const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['data-size', 'data-width', 'style', 'width', 'class', 'colspan', 'rowspan', 'colwidth', 'data-caption'],
    ADD_TAGS: ['figure', 'figcaption']
  });

const PostContent: React.FC<PostContentProps> = ({ contentHtml }) => {
  if (!contentHtml || !contentHtml.trim()) {
    return null;
  }

  return (
    <div
      className="rich-content"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(contentHtml) }}
    />
  );
};

export default PostContent;

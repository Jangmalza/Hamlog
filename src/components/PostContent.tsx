import React from 'react';
import DOMPurify from 'dompurify';
import type { PostSection } from '../data/blogData';

interface PostContentProps {
  sections?: PostSection[];
  contentHtml?: string;
}

const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['data-size', 'data-width', 'style', 'width', 'class', 'colspan', 'rowspan', 'colwidth']
  });

const PostContent: React.FC<PostContentProps> = ({ sections = [], contentHtml }) => {
  if (contentHtml && contentHtml.trim()) {
    return (
      <div
        className="rich-content"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(contentHtml) }}
      />
    );
  }

  return (
    <div className="post-content">
      {sections.map((section, index) => {
        const key = `${section.type}-${index}`;

        switch (section.type) {
          case 'heading':
            return (
              <h2 key={key} className="post-heading">
                {section.content}
              </h2>
            );
          case 'paragraph':
            return (
              <p key={key} className="post-paragraph">
                {section.content}
              </p>
            );
          case 'list':
            return (
              <ul key={key} className="post-list">
                {section.content.map((item, itemIndex) => (
                  <li key={`${item}-${itemIndex}`}>{item}</li>
                ))}
              </ul>
            );
          case 'code':
            return (
              <div key={key} className="post-code">
                {section.language && (
                  <div className="post-code-label">{section.language}</div>
                )}
                <pre>
                  <code>{section.content}</code>
                </pre>
              </div>
            );
          case 'quote':
            return (
              <blockquote key={key} className="post-quote">
                {section.content}
              </blockquote>
            );
          case 'callout':
            return (
              <div key={key} className="post-callout">
                {section.content}
              </div>
            );
          case 'image':
            return (
              <figure key={key} className="post-image">
                <img src={section.content} alt={section.alt ?? ''} loading="lazy" />
                {section.caption && (
                  <figcaption className="post-image-caption">
                    {section.caption}
                  </figcaption>
                )}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

export default PostContent;

import React from 'react';

interface PostInspectorSectionProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const PostInspectorSection: React.FC<PostInspectorSectionProps> = ({
  title,
  description,
  action,
  children
}) => {
  return (
    <section className="rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-4 shadow-[0_18px_40px_-28px_rgba(9,42,36,0.45)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
          {description && (
            <p className="text-[11px] leading-5 text-[var(--text-muted)]">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
};

export default PostInspectorSection;

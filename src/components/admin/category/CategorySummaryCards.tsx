import React from 'react';
import { Files, FolderTree, Layers3, Sparkles } from 'lucide-react';
import type { CategorySummaryCardsProps } from './types';

const CategorySummaryCards: React.FC<CategorySummaryCardsProps> = ({ summary }) => (
  <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <FolderTree size={14} />
        관리 카테고리
      </div>
      <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{summary.managedCount}</p>
    </div>
    <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <Layers3 size={14} />
        최상위 묶음
      </div>
      <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{summary.rootCount}</p>
    </div>
    <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <Files size={14} />
        미분류 글
      </div>
      <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{summary.uncategorizedCount}</p>
    </div>
    <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <Sparkles size={14} />
        자동 감지
      </div>
      <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{summary.autoDetectedCount}</p>
    </div>
  </div>
);

export default CategorySummaryCards;

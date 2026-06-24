import React from 'react';
import { Files, FolderTree, Layers3, Sparkles } from 'lucide-react';
import type { CategorySummaryCardsProps } from './types';

const CategorySummaryCards: React.FC<CategorySummaryCardsProps> = ({ summary }) => (
  <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        <FolderTree size={13} />
        관리 카테고리
      </div>
      <p className="mt-1 text-xl font-semibold text-[var(--text)]">{summary.managedCount}</p>
    </div>
    <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        <Layers3 size={13} />
        최상위 묶음
      </div>
      <p className="mt-1 text-xl font-semibold text-[var(--text)]">{summary.rootCount}</p>
    </div>
    <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        <Files size={13} />
        미분류 글
      </div>
      <p className="mt-1 text-xl font-semibold text-[var(--text)]">{summary.uncategorizedCount}</p>
    </div>
    <div className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        <Sparkles size={13} />
        자동 감지
      </div>
      <p className="mt-1 text-xl font-semibold text-[var(--text)]">{summary.autoDetectedCount}</p>
    </div>
  </div>
);

export default CategorySummaryCards;

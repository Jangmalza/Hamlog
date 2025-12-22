import React from 'react';
import { normalizeCategoryKey } from '../../../utils/category';

interface CategorySectionProps {
  managedCategories: string[];
  categoryUsage: Map<string, number>;
  categoriesLoading: boolean;
  categoriesError: string;
  categoryInput: string;
  onCategoryInputChange: (value: string) => void;
  onAddCategory: () => void;
  onDeleteCategory: (category: string) => void;
  onReload: () => void;
  categorySaving: boolean;
  defaultCategory: string;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  managedCategories,
  categoryUsage,
  categoriesLoading,
  categoriesError,
  categoryInput,
  onCategoryInputChange,
  onAddCategory,
  onDeleteCategory,
  onReload,
  categorySaving,
  defaultCategory
}) => (
  <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
          카테고리 관리
        </p>
        <h2 className="mt-2 font-display text-lg font-semibold">카테고리</h2>
      </div>
      <button
        type="button"
        onClick={onReload}
        disabled={categoriesLoading}
        className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        새로고침
      </button>
    </div>
    <p className="mt-2 text-sm text-[var(--text-muted)]">
      카테고리를 삭제하면 해당 글은 자동으로 미분류로 이동합니다.
    </p>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <input
        value={categoryInput}
        onChange={(event) => onCategoryInputChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onAddCategory();
          }
        }}
        placeholder="새 카테고리 입력"
        className="w-full min-w-[220px] flex-1 rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)]"
      />
      <button
        type="button"
        onClick={onAddCategory}
        disabled={categorySaving}
        className="rounded-full bg-[var(--accent)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        추가
      </button>
    </div>
    {categoriesLoading && (
      <p className="mt-3 text-xs text-[var(--text-muted)]">카테고리 불러오는 중...</p>
    )}
    {categoriesError && <p className="mt-3 text-xs text-red-500">{categoriesError}</p>}
    <div className="mt-4 flex flex-wrap gap-2">
      {managedCategories.map(category => {
        const key = normalizeCategoryKey(category);
        const count = categoryUsage.get(key) ?? 0;
        const isDefault = key === normalizeCategoryKey(defaultCategory);
        return (
          <span
            key={category}
            className="flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-muted)]"
          >
            {category}
            <span className="text-[10px] text-[var(--text-muted)]">{count}개</span>
            <button
              type="button"
              onClick={() => onDeleteCategory(category)}
              disabled={isDefault || categorySaving}
              className="text-[11px] text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`${category} 삭제`}
            >
              ×
            </button>
          </span>
        );
      })}
      {managedCategories.length === 0 && !categoriesLoading && (
        <span className="text-xs text-[var(--text-muted)]">
          등록된 카테고리가 없습니다.
        </span>
      )}
    </div>
  </div>
);

export default CategorySection;

import { normalizeCategoryKey } from '../../../utils/category';
import CategoryPicker from '../category/CategoryPicker';
import type { SidebarFiltersProps } from './types';

export default function SidebarFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterCategory,
  onFilterCategoryChange,
  filterCategoryIncludeDescendants,
  onFilterCategoryIncludeDescendantsChange,
  categoryTree,
  statusFilters,
  quickCategoryNodes
}: SidebarFiltersProps) {
  return (
    <div className="space-y-4 rounded-xl border border-[color:var(--border)] bg-[var(--surface-muted)] p-4">
      <div className="relative">
        <input
          type="text"
          placeholder="제목 또는 슬러그 검색"
          value={searchQuery}
          onChange={event => onSearchChange(event.target.value)}
          className="w-full rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {statusFilters.map(option => (
          <button
            key={option.key}
            type="button"
            onClick={() => onFilterStatusChange(option.key)}
            className={`rounded-lg border px-3 py-2 text-left transition ${
              filterStatus === option.key
                ? 'border-[color:var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[color:var(--accent)] hover:text-[var(--text)]'
            }`}
          >
            <div className="text-[11px] font-semibold">{option.label}</div>
            <div className="mt-1 text-lg font-semibold">{option.count}</div>
          </button>
        ))}
      </div>

      <CategoryPicker
        categoryTree={categoryTree}
        value={filterCategory}
        onChange={onFilterCategoryChange}
        defaultOptionLabel="모든 카테고리"
        mode="filter"
        includeDescendants={filterCategoryIncludeDescendants}
        onIncludeDescendantsChange={onFilterCategoryIncludeDescendantsChange}
        recentStorageKey="hamlog:admin:sidebar-categories"
        triggerClassName="flex w-full items-center justify-between rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition hover:border-[color:var(--accent)]"
        panelClassName="relative z-20 w-full rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-4 shadow-2xl"
      />

      {quickCategoryNodes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickCategoryNodes.map(node => (
            <button
              key={node.id}
              type="button"
              onClick={() => onFilterCategoryChange(node.name)}
              className={`rounded-lg border px-3 py-1.5 text-[11px] transition ${
                normalizeCategoryKey(filterCategory) === normalizeCategoryKey(node.name)
                  ? 'border-[color:var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                  : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[color:var(--accent)] hover:text-[var(--text)]'
              }`}
            >
              {node.name} · {node.count}
            </button>
          ))}
        </div>
      )}

      {(filterStatus !== 'all' || filterCategory !== 'all') && (
        <div className="flex flex-wrap gap-2">
          {filterStatus !== 'all' && (
            <button
              type="button"
              onClick={() => onFilterStatusChange('all')}
              className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] text-[var(--text-muted)] transition hover:border-[color:var(--accent)] hover:text-[var(--text)]"
            >
              상태 해제
            </button>
          )}
          {filterCategory !== 'all' && (
            <button
              type="button"
              onClick={() => onFilterCategoryChange('all')}
              className="rounded-lg border border-[color:var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] text-[var(--text-muted)] transition hover:border-[color:var(--accent)] hover:text-[var(--text)]"
            >
              카테고리 해제
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import type { AdminSection } from '../../types/admin';

interface AdminNavProps {
  activeSection: AdminSection;
  sections: Array<{ key: AdminSection; label: string }>;
  onChange: (section: AdminSection) => void;
}

const AdminNav: React.FC<AdminNavProps> = ({ activeSection, sections, onChange }) => (
  <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
    <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
      관리 메뉴
    </p>
    <div className="mt-3 flex flex-wrap gap-2">
      {sections.map(item => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
            activeSection === item.key
              ? 'border-[color:var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
              : 'border-[color:var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
          }`}
          aria-current={activeSection === item.key ? 'page' : undefined}
        >
          {item.label}
        </button>
      ))}
    </div>
  </div>
);

export default AdminNav;

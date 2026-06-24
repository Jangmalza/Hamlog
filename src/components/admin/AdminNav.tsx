import React from 'react';
import type { AdminSection } from '../../types/admin';

interface AdminNavProps {
  activeSection: AdminSection;
  sections: Array<{ key: AdminSection; label: string }>;
  onChange: (section: AdminSection) => void;
}

const AdminNav: React.FC<AdminNavProps> = ({ activeSection, sections, onChange }) => (
  <nav
    aria-label="관리 메뉴"
    className="flex flex-wrap items-center gap-1 rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-1"
  >
    {sections.map(item => (
      <button
        key={item.key}
        type="button"
        onClick={() => onChange(item.key)}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
          activeSection === item.key
            ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'
            : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
        }`}
        aria-current={activeSection === item.key ? 'page' : undefined}
      >
        {item.label}
      </button>
    ))}
  </nav>
);

export default AdminNav;

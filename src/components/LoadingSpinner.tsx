import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = '로딩 중...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-[var(--text)]">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--accent)]"></div>
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
        {message}
      </p>
    </div>
  );
};

export default LoadingSpinner;

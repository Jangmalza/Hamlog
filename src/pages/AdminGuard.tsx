import React, { useEffect, useState } from 'react';

interface AdminGuardProps {
  children: React.ReactNode;
}

const SESSION_KEY = 'admin_authed_v1';

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const expected = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) || 'admin1234';

  useEffect(() => {
    const ok = sessionStorage.getItem(SESSION_KEY) === 'true';
    setIsAuthed(ok);
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password === expected) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setIsAuthed(true);
      setError('');
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  if (isAuthed) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-[var(--text)]">
      <div className="w-full max-w-sm rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
          관리자 접근
        </p>
        <h1 className="mt-2 font-display text-xl font-semibold">비밀번호 입력</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          기본 비밀번호는 <span className="font-mono">admin1234</span>입니다. 배포 환경에서는
          <span className="font-mono"> VITE_ADMIN_PASSWORD</span>로 변경하세요.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            비밀번호
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-soft)]"
              placeholder="••••••••"
              aria-label="관리자 비밀번호"
            />
          </label>
          {error && <p className="text-sm text-[var(--accent-strong)]">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            로그인
          </button>
        </form>
        <div className="mt-4 text-center">
          <a
            href="/"
            className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--accent-strong)]"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminGuard;

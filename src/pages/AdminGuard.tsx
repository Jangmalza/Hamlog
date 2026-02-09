import React, { useEffect, useState } from 'react';
import * as authApi from '../api/authApi';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      await authApi.getMe();
      setIsAuthed(true);
    } catch {
      setIsAuthed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await authApi.login(password);
      setIsAuthed(true);
      setError('');
    } catch {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  if (isLoading) return null; // Or a loading spinner
  if (isAuthed) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-[var(--text)]">
      <div className="w-full max-w-sm rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
          관리자 접근
        </p>
        <h1 className="mt-2 font-display text-xl font-semibold">비밀번호 입력</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          서버에 설정된 관리자 비밀번호를 입력해주세요.
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

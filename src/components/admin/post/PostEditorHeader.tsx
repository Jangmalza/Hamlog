interface PostEditorHeaderProps {
  activeId: string | null;
  title: string;
  onTitleChange: (value: string) => void;
}

export default function PostEditorHeader({
  activeId,
  title,
  onTitleChange
}: PostEditorHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {activeId ? '편집 중인 글' : '새 글 초안'}
        </span>
        <span className="text-[11px] text-[var(--text-muted)]">
          `Ctrl/Cmd + S` 저장, `Ctrl/Cmd + Enter` 발행, `Alt + Shift + P` 미리보기
        </span>
      </div>
      <input
        value={title}
        onChange={event => onTitleChange(event.target.value)}
        placeholder="제목을 입력하세요"
        className="w-full bg-transparent text-4xl font-bold leading-tight text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
      />
    </div>
  );
}

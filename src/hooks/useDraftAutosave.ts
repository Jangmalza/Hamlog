import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PostDraft } from '../types/admin';

export interface StoredDraft {
  draft: PostDraft;
  updatedAt: number;
  activeId: string | null;
}

const STORAGE_KEY_PREFIX = 'hamlog:editor:draft:';

const getStorageKey = (postId: string | null) =>
  `${STORAGE_KEY_PREFIX}${postId ?? 'new'}`;

interface UseDraftAutosaveProps {
  draft: PostDraft;
  activeId: string | null;
}

export const useDraftAutosave = ({ draft, activeId }: UseDraftAutosaveProps) => {
  const [restoreCandidate, setRestoreCandidate] = useState<StoredDraft | null>(null);
  const [autosavePaused, setAutosavePaused] = useState(false);
  const [lastAutosavedAt, setLastAutosavedAt] = useState<number | null>(null);

  const storageKey = useMemo(() => getStorageKey(activeId), [activeId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      setRestoreCandidate(null);
      setAutosavePaused(false);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as StoredDraft;
      if (parsed?.draft) {
        setRestoreCandidate(parsed);
        setAutosavePaused(true);
        setLastAutosavedAt(parsed.updatedAt);
      } else {
        setRestoreCandidate(null);
        setAutosavePaused(false);
      }
    } catch {
      setRestoreCandidate(null);
      setAutosavePaused(false);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (autosavePaused) return;
    const timer = window.setTimeout(() => {
      const payload: StoredDraft = {
        draft,
        updatedAt: Date.now(),
        activeId
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
      setLastAutosavedAt(payload.updatedAt);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [draft, activeId, autosavePaused, storageKey]);

  const clearAutosave = useCallback(
    (postId?: string | null) => {
      if (typeof window === 'undefined') return;
      const key = getStorageKey(postId ?? activeId);
      window.localStorage.removeItem(key);
    },
    [activeId]
  );

  const restoreDraft = useCallback(() => {
    if (!restoreCandidate) return null;
    const next = restoreCandidate;
    setRestoreCandidate(null);
    setAutosavePaused(false);
    return next;
  }, [restoreCandidate]);

  const discardRestore = useCallback(() => {
    clearAutosave(activeId);
    setRestoreCandidate(null);
    setAutosavePaused(false);
  }, [activeId, clearAutosave]);

  return {
    restoreCandidate,
    autosavePaused,
    setAutosavePaused,
    lastAutosavedAt,
    clearAutosave,
    restoreDraft,
    discardRestore
  };
};

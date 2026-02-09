import { useCallback, useEffect } from 'react';
import type { PostDraft } from '../types/admin';

interface UseAutosaveProps {
    activeId: string | null;
    draft: PostDraft;
    setDraft: (draft: PostDraft) => void;
    setNotice: (message: string) => void;
    onLoadDraft: () => PostDraft; // To compare against
}

export const useAutosave = ({
    activeId,
    draft,
    setDraft,
    setNotice,
    onLoadDraft
}: UseAutosaveProps) => {
    const autosaveKey = `hamlog_draft_${activeId || 'new'}`;

    // Check for autosave on mount (or when activeId changes)
    useEffect(() => {
        const saved = localStorage.getItem(autosaveKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const currentInit = onLoadDraft();

                // Only notify if content/title is different from what was just loaded from DB
                if (parsed.contentHtml !== currentInit.contentHtml || parsed.title !== currentInit.title) {
                    setNotice('임시 저장된 내용이 있습니다. 복구하시겠습니까? (클릭)');
                }
            } catch {
                // ignore invalid json
            }
        }
    }, [autosaveKey, onLoadDraft, setNotice]); // Check once per post switch

    // Save to LocalStorage (Debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (draft.contentHtml || draft.title) {
                localStorage.setItem(autosaveKey, JSON.stringify(draft));
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [draft, autosaveKey]);

    const clearAutosave = useCallback(() => {
        localStorage.removeItem(autosaveKey);
    }, [autosaveKey]);

    const handleRestoreAutosave = useCallback(() => {
        const saved = localStorage.getItem(autosaveKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setDraft(parsed);
                setNotice('임시 저장된 내용을 복구했습니다.');
            } catch {
                setNotice('복구에 실패했습니다.');
            }
        }
    }, [autosaveKey, setDraft, setNotice]);

    return {
        clearAutosave,
        handleRestoreAutosave
    };
};

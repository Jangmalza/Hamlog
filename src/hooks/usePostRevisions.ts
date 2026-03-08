import { useCallback, useEffect, useState } from 'react';
import { fetchPostRevisions, restorePostRevision } from '../api/postApi';
import type { Post, PostRevision } from '../data/blogData';

interface UsePostRevisionsOptions {
  activeId: string | null;
  setNotice: (message: string) => void;
  onAfterRestore: (post: Post) => Promise<void> | void;
}

export const usePostRevisions = ({
  activeId,
  setNotice,
  onAfterRestore
}: UsePostRevisionsOptions) => {
  const [revisions, setRevisions] = useState<PostRevision[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [restoringRevisionId, setRestoringRevisionId] = useState<string | null>(null);

  const loadRevisions = useCallback(async (postId: string) => {
    setRevisionsLoading(true);
    try {
      const nextRevisions = await fetchPostRevisions(postId);
      setRevisions(nextRevisions);
    } catch (error) {
      console.error(error);
      setNotice('리비전 내역을 불러오지 못했습니다.');
    } finally {
      setRevisionsLoading(false);
    }
  }, [setNotice]);

  useEffect(() => {
    if (!activeId) {
      setRevisions([]);
      setRevisionsLoading(false);
      return;
    }

    void loadRevisions(activeId);
  }, [activeId, loadRevisions]);

  const handleRestoreRevision = useCallback(async (revisionId: string) => {
    if (!activeId) return;

    const confirmed = window.confirm('선택한 리비전으로 복구할까요? 현재 저장본은 새 리비전으로 보관됩니다.');
    if (!confirmed) return;

    setRestoringRevisionId(revisionId);
    setNotice('');

    try {
      const restoredPost = await restorePostRevision(activeId, revisionId);
      await onAfterRestore(restoredPost);
      await loadRevisions(restoredPost.id);
      setNotice('리비전을 복구했습니다.');
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message) {
        setNotice(error.message);
      } else {
        setNotice('리비전 복구에 실패했습니다.');
      }
    } finally {
      setRestoringRevisionId(null);
    }
  }, [activeId, loadRevisions, onAfterRestore, setNotice]);

  return {
    revisions,
    revisionsLoading,
    restoringRevisionId,
    loadRevisions,
    handleRestoreRevision
  };
};

import { useState, useCallback } from 'react';
import type { PostDraft } from '../types/admin';
import type { Post, PostInput, PostStatus } from '../data/blogData';
import { usePostStore } from '../store/postStore';
import { slugify } from '../utils/slugify';
import { stripHtml } from '../utils/postContent';
import { normalizePostStatus } from '../utils/postStatus';
import { toIsoDateTime } from '../utils/adminDate';
import { normalizeDraftCategory, DEFAULT_CATEGORY } from '../utils/category';

interface UsePostPersistenceProps {
    draft: PostDraft;
    activeId: string | null;
    onSaveSuccess: (post: Post) => void;
    onDeleteSuccess: () => void;
    onAfterSave: () => void;
    setNotice: (message: string) => void;
}

export const usePostPersistence = ({
    draft,
    activeId,
    onSaveSuccess,
    onDeleteSuccess,
    onAfterSave,
    setNotice
}: UsePostPersistenceProps) => {
    const [saving, setSaving] = useState(false);

    const posts = usePostStore(state => state.posts);
    const addPost = usePostStore(state => state.addPost);
    const updatePost = usePostStore(state => state.updatePost);
    const deletePost = usePostStore(state => state.deletePost);

    const handleSave = useCallback(async (successMessage?: string, statusOverride?: PostStatus) => {
        setNotice('');
        const title = draft.title.trim();
        const slug = slugify(draft.slug.trim() || title);
        const contentHtml = draft.contentHtml?.trim() || '';
        const contentText = stripHtml(contentHtml);
        const status = normalizePostStatus(statusOverride ?? draft.status);
        const scheduledAtIso =
            status === 'scheduled' && draft.scheduledAt ? toIsoDateTime(draft.scheduledAt) : '';

        if (!title) {
            setNotice('제목을 입력하세요.');
            return;
        }

        if (!slug) {
            setNotice('슬러그를 입력하세요.');
            return;
        }

        if (status !== 'draft' && !contentText) {
            setNotice('본문 내용을 입력하세요.');
            return;
        }

        if (status === 'scheduled' && !scheduledAtIso) {
            setNotice('예약 발행 날짜를 입력하세요.');
            return;
        }

        const slugTaken = posts.some(p => p.slug === slug && p.id !== activeId);
        if (slugTaken) {
            setNotice('슬러그가 이미 존재합니다.');
            return;
        }

        const tags = draft.tags
            .map(tag => tag.trim())
            .filter(Boolean)
            .filter((tag, index, list) => list.indexOf(tag) === index);

        const seoKeywords = draft.seoKeywords
            .split(',')
            .map(keyword => keyword.trim())
            .filter(Boolean);
        const seo = {
            title: draft.seoTitle.trim() || undefined,
            description: draft.seoDescription.trim() || undefined,
            ogImage: draft.seoOgImage.trim() || undefined,
            canonicalUrl: draft.seoCanonicalUrl.trim() || undefined,
            keywords: seoKeywords.length ? seoKeywords : undefined
        };
        const publishedAt =
            status === 'scheduled' && scheduledAtIso
                ? scheduledAtIso.slice(0, 10)
                : draft.publishedAt || new Date().toISOString().slice(0, 10);

        const payload: PostInput = {
            slug,
            title,
            summary: draft.summary.trim() || '요약이 없습니다.',
            category: normalizeDraftCategory(draft.category, DEFAULT_CATEGORY),
            contentHtml: contentHtml || undefined,
            publishedAt,
            readingTime: draft.readingTime.trim() || '3분 읽기',
            tags,
            series: draft.series.trim() || undefined,
            featured: draft.featured,
            cover: draft.cover.trim() || undefined,
            status,
            scheduledAt: status === 'scheduled' ? scheduledAtIso || undefined : '',
            seo:
                seo.title || seo.description || seo.ogImage || seo.canonicalUrl || seo.keywords
                    ? seo
                    : undefined,
            sections: []
        };

        setSaving(true);
        try {
            const saved = activeId
                ? await updatePost(activeId, payload)
                : await addPost(payload);

            const fallbackMessage = activeId ? '글이 저장되었습니다.' : '새 글이 생성되었습니다.';
            setNotice(successMessage ?? fallbackMessage);

            // Notify Parent
            onSaveSuccess(saved);
            onAfterSave();

        } catch (error) {
            if (error instanceof Error && error.message) {
                setNotice(error.message);
            } else {
                setNotice('저장에 실패했습니다.');
            }
        } finally {
            setSaving(false);
        }
    }, [draft, posts, activeId, updatePost, addPost, onSaveSuccess, onAfterSave, setNotice]);

    const handleDelete = async () => {
        if (!activeId) return;
        const confirmed = window.confirm(`"${draft.title}" 글을 삭제할까요? 되돌릴 수 없습니다.`);
        if (!confirmed) return;

        setSaving(true);
        try {
            await deletePost(activeId);
            setNotice('글이 삭제되었습니다.');
            onDeleteSuccess();
        } catch (error) {
            if (error instanceof Error && error.message) {
                setNotice(error.message);
            } else {
                setNotice('삭제에 실패했습니다.');
            }
        } finally {
            setSaving(false);
        }
    };

    return {
        handleSave,
        handleDelete,
        saving,
        setSaving
    };
};

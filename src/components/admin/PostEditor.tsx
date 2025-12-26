
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { useTiptapEditor } from '../../hooks/useTiptapEditor';
import PostEditorSection from './sections/PostEditorSection';
import { useEditorImageControls } from '../../hooks/useEditorImageControls';
import { uploadLocalImage } from '../../api/uploadApi';
import { usePostStore } from '../../store/postStore';
import type { Post, PostInput, PostStatus } from '../../data/blogData';
import type { PostDraft } from '../../types/admin';
import { formatDateTimeLocal, toIsoDateTime } from '../../utils/adminDate';
import {
    DEFAULT_CATEGORY,
    normalizeDraftCategory
} from '../../utils/category';
import { stripHtml, sectionsToHtml } from '../../utils/postContent';
import { slugify } from '../../utils/slugify';
import { normalizePostStatus } from '../../utils/postStatus';

const MAX_UPLOAD_MB = 8;

const formatSeoKeywords = (keywords?: string[]) =>
    keywords && keywords.length > 0 ? keywords.join(', ') : '';

const toDraft = (post?: Post): PostDraft => {
    if (!post) {
        return {
            title: '',
            slug: '',
            summary: '',
            category: DEFAULT_CATEGORY,
            contentHtml: '',
            publishedAt: new Date().toISOString().slice(0, 10),
            readingTime: '3분 읽기',
            tags: [],
            series: '',
            featured: false,
            cover: '',
            status: 'draft',
            scheduledAt: '',
            seoTitle: '',
            seoDescription: '',
            seoOgImage: '',
            seoCanonicalUrl: '',
            seoKeywords: ''
        };
    }

    const contentHtml = post.contentHtml?.trim()
        ? post.contentHtml
        : post.sections.length
            ? sectionsToHtml(post.sections)
            : '';

    return {
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        category: normalizeDraftCategory(post.category ?? '', DEFAULT_CATEGORY),
        contentHtml,
        publishedAt: post.publishedAt.slice(0, 10),
        readingTime: post.readingTime,
        tags: post.tags ?? [],
        series: post.series ?? '',
        featured: Boolean(post.featured),
        cover: post.cover ?? '',
        status: normalizePostStatus(post.status),
        scheduledAt: formatDateTimeLocal(post.scheduledAt),
        seoTitle: post.seo?.title ?? '',
        seoDescription: post.seo?.description ?? '',
        seoOgImage: post.seo?.ogImage ?? '',
        seoCanonicalUrl: post.seo?.canonicalUrl ?? '',
        seoKeywords: formatSeoKeywords(post.seo?.keywords)
    };
};

import type { CategoryTreeResult } from '../../utils/categoryTree';

interface PostEditorProps {
    post: Post | null;
    onSaveSuccess: (post: Post) => void;
    onDeleteSuccess: () => void;
    categoryTree: CategoryTreeResult;
    onLoadCategories: () => void | Promise<void>;
}

const PostEditor: React.FC<PostEditorProps> = ({ post, onSaveSuccess, onDeleteSuccess, categoryTree, onLoadCategories }) => {
    const activeId = post?.id || null;
    const posts = usePostStore(state => state.posts);
    const addPost = usePostStore(state => state.addPost);
    const updatePost = usePostStore(state => state.updatePost);
    const deletePost = usePostStore(state => state.deletePost);

    const [draft, setDraft] = useState<PostDraft>(() => toDraft(post || undefined));
    const [slugTouched, setSlugTouched] = useState(!!post);
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [previewMode, setPreviewMode] = useState(false);
    const editorRef = useRef<Editor | null>(null);

    // Initial load sync
    useEffect(() => {
        setDraft(toDraft(post || undefined));
        setSlugTouched(!!post);
        setNotice('');
        setTagInput('');
        setPreviewMode(false);
    }, [post]);

    const {
        fileInputRef,
        uploadingImage,
        uploadError,
        imageWidthInput,
        imageWidthError,
        setImageWidthInput,
        setImageWidthError,
        uploadImageToEditor,
        handleSelectionUpdate,
        handlePaste,
        handleDrop,
        applyImageWidth,
        clearImageWidth,
        handleToolbarImageUpload,
        handleInsertImageUrl
    } = useEditorImageControls({
        editorRef,
        maxUploadMb: MAX_UPLOAD_MB,
        uploadLocalImage
    });

    const editor = useTiptapEditor({
        contentHtml: draft.contentHtml || '',
        setDraft,
        handleSelectionUpdate,
        handlePaste,
        handleDrop
    });

    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    // Sync editor content when draft changes (e.g. from restore or initial load)
    useEffect(() => {
        if (!editor) return;
        const safeHtml = draft.contentHtml?.trim() ? draft.contentHtml : '';
        if (editor.getHTML() !== safeHtml) {
            // Only set content if significant difference to avoid cursor jump issues 
            // on simple typing, but here draft.contentHtml is usually the source of truth
            // passed into useTiptapEditor. 
            // However, if we switch posts, we MUST force update.
            editor.commands.setContent(safeHtml, false);
        }
    }, [editor, activeId]); // Dependency on activeId ensures content swap on post switch

    const contentStats = useMemo(() => {
        const plainText = stripHtml(draft.contentHtml || '');
        const readingMinutes = Math.max(1, Math.ceil(plainText.length / 450));
        return {
            chars: plainText.length,
            readingMinutes
        };
    }, [draft.contentHtml]);


    const handleTitleChange = (value: string) => {
        setDraft(prev => {
            const next = { ...prev, title: value };
            if (!slugTouched) {
                next.slug = slugify(value);
            }
            return next;
        });
    };

    const handleStatusChange = (value: PostStatus) => {
        setDraft(prev => ({
            ...prev,
            status: value,
            scheduledAt: value === 'scheduled' ? prev.scheduledAt : ''
        }));
    };

    const updateDraft = useCallback((patch: Partial<PostDraft>) => {
        setDraft(prev => ({ ...prev, ...patch }));
    }, []);

    const addTag = (value: string) => {
        const normalized = value.replace(/^#/, '').trim();
        if (!normalized) return;
        setDraft(prev => {
            if (prev.tags.includes(normalized)) return prev;
            return { ...prev, tags: [...prev.tags, normalized] };
        });
    };

    const removeTag = (value: string) => {
        setDraft(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== value) }));
    };

    const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addTag(tagInput);
            setTagInput('');
        }
    };

    const handleTagBlur = () => {
        if (tagInput.trim()) {
            addTag(tagInput);
            setTagInput('');
        }
    };

    const handleImageUpload = async (file: File) => {
        await uploadImageToEditor(file);
    };

    const handleLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('링크 URL을 입력하세요', previousUrl ?? '');
        if (url === null) return;
        if (!url) {
            editor.chain().focus().unsetLink().run();
            return;
        }
        editor.chain().focus().setLink({ href: url }).run();
    };

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

            setSlugTouched(true);
            setTagInput('');
            void onLoadCategories();
        } catch (error) {
            if (error instanceof Error && error.message) {
                setNotice(error.message);
            } else {
                setNotice('저장에 실패했습니다.');
            }
        } finally {
            setSaving(false);
        }
    }, [draft, posts, activeId, updatePost, addPost, onSaveSuccess, slugTouched, onLoadCategories]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                void handleSave('수동 저장되었습니다.');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

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

    return (
        <PostEditorSection
            draft={draft}
            categoryTree={categoryTree}
            contentStats={contentStats}
            notice={notice}
            saving={saving}
            activeId={activeId}
            tagInput={tagInput}
            onTagInputChange={(value) => setTagInput(value)}
            onTagKeyDown={handleTagKeyDown}
            onTagBlur={handleTagBlur}
            onRemoveTag={removeTag}
            onTitleChange={handleTitleChange}
            onStatusChange={handleStatusChange}
            onSave={(message, statusOverride) =>
                void handleSave(message, statusOverride)
            }
            onDelete={() => void handleDelete()}
            updateDraft={updateDraft}
            previewMode={previewMode}
            setPreviewMode={(value) => setPreviewMode(value)}
            editor={editor}
            onLink={handleLink}
            onToolbarImageUpload={handleToolbarImageUpload}
            onInsertImageUrl={handleInsertImageUrl}
            uploadingImage={uploadingImage}
            uploadError={uploadError}
            imageWidthInput={imageWidthInput}
            imageWidthError={imageWidthError}
            onImageWidthInputChange={(value) => {
                setImageWidthInput(value);
                setImageWidthError('');
            }}
            onApplyImageWidth={applyImageWidth}
            onClearImageWidth={clearImageWidth}
            fileInputRef={fileInputRef}
            onImageUpload={(file) => void handleImageUpload(file)}
        />
    );
};

export default PostEditor;

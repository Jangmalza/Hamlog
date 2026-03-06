
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import { useTiptapEditor } from '../../hooks/useTiptapEditor';
import PostEditorSection from './sections/PostEditorSection';
import { useEditorImageControls } from '../../hooks/useEditorImageControls';
import { uploadLocalImage } from '../../api/uploadApi';
import { fetchPostRevisions, restorePostRevision } from '../../api/postApi';
import type { Post, PostRevision, PostStatus } from '../../data/blogData';
import { stripHtml } from '../../utils/postContent';
import type { CategoryTreeResult } from '../../utils/categoryTree';
import { usePostForm, toDraft } from '../../hooks/usePostForm';
import { useAutosave } from '../../hooks/useAutosave';
import { usePostPersistence } from '../../hooks/usePostPersistence';
import { promptForText } from '../../utils/editorDialog';
import { usePostStore } from '../../store/postStore';

const MAX_UPLOAD_MB = 8;

const serializeContentJson = (contentJson?: JSONContent) =>
    contentJson ? JSON.stringify(contentJson) : '';

interface PostEditorProps {
    post: Post | null;
    onSaveSuccess: (post: Post) => void;
    onDeleteSuccess: () => void;
    categoryTree: CategoryTreeResult;
    onLoadCategories: () => void | Promise<void>;
}

const PostEditor: React.FC<PostEditorProps> = ({ post, onSaveSuccess, onDeleteSuccess, categoryTree, onLoadCategories }) => {
    const activeId = post?.id || null;
    const refreshPosts = usePostStore(state => state.fetchPosts);

    // 1. Form Logic (extracted)
    const {
        draft,
        setDraft,
        setSlugTouched,
        tagInput,
        setTagInput,
        updateDraft,
        handleTitleChange,
        handleStatusChange,
        removeTag,
        handleTagKeyDown,
        handleTagBlur
    } = usePostForm(post);

    const [notice, setNotice] = useState('');
    const [previewMode, setPreviewMode] = useState(false);
    const [revisions, setRevisions] = useState<PostRevision[]>([]);
    const [revisionsLoading, setRevisionsLoading] = useState(false);
    const [restoringRevisionId, setRestoringRevisionId] = useState<string | null>(null);
    const editorRef = useRef<Editor | null>(null);
    const loadDraftSnapshot = useCallback(() => toDraft(post || undefined), [post]);

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
    }, []);

    // 2. Auto-save Logic (extracted)
    const {
        clearAutosave,
        handleRestoreAutosave,
        discardAutosave,
        hasRestorableDraft,
        autosaveUpdatedAt
    } = useAutosave({
        activeId,
        draft,
        setDraft,
        setNotice,
        onLoadDraft: loadDraftSnapshot
    });

    // Reset UI on post change
    useEffect(() => {
        setNotice('');
        setPreviewMode(false);
    }, [post]);

    // 3. Persistence Logic (extracted)
    const {
        handleSave,
        handleDelete,
        saving,
    } = usePostPersistence({
        draft,
        activeId,
        onSaveSuccess: useCallback((savedPost: Post) => {
            onSaveSuccess(savedPost);
            void loadRevisions(savedPost.id);
        }, [onSaveSuccess, loadRevisions]),
        onDeleteSuccess,
        setNotice,
        onAfterSave: useCallback(() => {
            setSlugTouched(true);
            setTagInput('');
            clearAutosave();
            void onLoadCategories();
        }, [setSlugTouched, setTagInput, clearAutosave, onLoadCategories])
    });

    // Reset notice when post changes
    useEffect(() => {
        setNotice('');
    }, [post, setNotice]);

    useEffect(() => {
        if (!activeId) {
            setRevisions([]);
            setRevisionsLoading(false);
            return;
        }

        void loadRevisions(activeId);
    }, [activeId, loadRevisions]);

    const {
        fileInputRef,
        uploadingImage,
        uploadError,
        uploadImageToEditor,
        handleSelectionUpdate,
        handlePaste,
        handleDrop,
        handleToolbarImageUpload,
        handleInsertImageUrl
    } = useEditorImageControls({
        editorRef,
        maxUploadMb: MAX_UPLOAD_MB,
        uploadLocalImage
    });

    const editor = useTiptapEditor({
        contentJson: draft.contentJson,
        contentHtml: draft.contentHtml || '',
        setDraft,
        handleSelectionUpdate,
        handlePaste,
        handleDrop
    });

    const draftContentJsonKey = useMemo(
        () => serializeContentJson(draft.contentJson),
        [draft.contentJson]
    );

    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    // Sync editor content when draft changes
    useEffect(() => {
        if (!editor) return;
        if (draftContentJsonKey) {
            const editorContentKey = serializeContentJson(editor.getJSON());
            if (editorContentKey !== draftContentJsonKey && draft.contentJson) {
                editor.commands.setContent(draft.contentJson, false);
            }
            return;
        }

        const safeHtml = draft.contentHtml?.trim() ? draft.contentHtml : '';
        if (editor.getHTML() !== safeHtml) {
            editor.commands.setContent(safeHtml, false);
        }
    }, [editor, activeId, draft.contentHtml, draft.contentJson, draftContentJsonKey]);

    const contentStats = useMemo(() => {
        const plainText = stripHtml(draft.contentHtml || '');
        const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
        const readingMinutes = Math.max(1, Math.ceil(plainText.length / 450));
        return {
            chars: plainText.length,
            words,
            readingMinutes
        };
    }, [draft.contentHtml]);

    const handleImageUpload = async (file: File) => {
        await uploadImageToEditor(file);
    };

    const handleCoverUpload = async (file: File) => {
        try {
            setNotice(''); // Using existing declared state
            setNotice('업로드 중...');
            const { url } = await uploadLocalImage(file);
            updateDraft({ cover: url });
            setNotice('대표 이미지가 업로드되었습니다.');
        } catch (error: unknown) {
            console.error(error);
            setNotice('이미지 업로드에 실패했습니다.');
        }
    };

    const handleSetCoverFromContent = useCallback((srcOverride?: string) => {
        if (srcOverride) {
            updateDraft({ cover: srcOverride });
            setNotice('선택한 이미지가 대표 이미지로 설정되었습니다.');
            return;
        }

        if (!editor) return;
        const { state } = editor;
        const { selection } = state;

        if (selection.empty) {
            setNotice('이미지를 선택해주세요.');
            return;
        }

        const node = editor.state.doc.nodeAt(selection.from);
        if (node && node.type.name === 'image') {
            const src = node.attrs.src;
            if (src) {
                updateDraft({ cover: src });
                setNotice('선택한 이미지가 대표 이미지로 설정되었습니다.');
            } else {
                setNotice('이미지 주소를 찾을 수 없습니다.');
            }
        } else {
            setNotice('이미지가 선택되지 않았습니다.');
        }
    }, [editor, updateDraft]);

    const handleRestoreRevision = useCallback(async (revisionId: string) => {
        if (!activeId) return;

        const confirmed = window.confirm('선택한 리비전으로 복구할까요? 현재 저장본은 새 리비전으로 보관됩니다.');
        if (!confirmed) return;

        setRestoringRevisionId(revisionId);
        setNotice('');

        try {
            const restoredPost = await restorePostRevision(activeId, revisionId);
            clearAutosave();
            setDraft(toDraft(restoredPost));
            await refreshPosts();
            onSaveSuccess(restoredPost);
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
    }, [activeId, clearAutosave, loadRevisions, onSaveSuccess, refreshPosts, setDraft]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();

            if ((e.metaKey || e.ctrlKey) && key === 's') {
                e.preventDefault();
                if (e.shiftKey) {
                    void handleSave('초안으로 저장되었습니다.', 'draft');
                    return;
                }
                void handleSave('수동 저장되었습니다.');
                return;
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                void handleSave('발행되었습니다.', 'published');
                return;
            }

            if (e.altKey && e.shiftKey && key === 'p') {
                e.preventDefault();
                setPreviewMode(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    const handleLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href as string | undefined;

        void (async () => {
            const rawUrl = await promptForText({
                title: '링크 URL 입력',
                defaultValue: previousUrl ?? '',
                placeholder: 'https://'
            });

            if (rawUrl === null) return;

            const url = rawUrl.trim();
            if (!url) {
                editor.chain().focus().unsetLink().run();
                return;
            }

            editor.chain().focus().setLink({ href: url }).run();
        })();
    };

    const groupedProps = {
        editorHandlers: {
            onTitleChange: handleTitleChange,
            onStatusChange: handleStatusChange,
            onSave: (message?: string, statusOverride?: PostStatus) => void handleSave(message, statusOverride),
            onDelete: () => void handleDelete(),
            onRestoreRevision: (revisionId: string) => void handleRestoreRevision(revisionId),
            updateDraft,
            setPreviewMode,
            onLink: handleLink
        },
        tagHandlers: {
            onInputChange: setTagInput,
            onKeyDown: handleTagKeyDown,
            onBlur: handleTagBlur,
            onRemove: removeTag
        },
        mediaHandlers: {
            onToolbarUpload: handleToolbarImageUpload,
            onInsertImageUrl: handleInsertImageUrl,
            onImageUpload: (file: File) => void handleImageUpload(file),
            fileInputRef,
            onCoverUpload: handleCoverUpload,
            onSetCoverFromContent: handleSetCoverFromContent,
            uploadLocalImage
        },
        uiState: {
            notice,
            saving,
            activeId,
            tagInput,
            previewMode,
            uploadingImage,
            uploadError,
            revisionsLoading,
            restoringRevisionId,
            onNoticeClick: notice.includes('복구') ? handleRestoreAutosave : undefined,
            hasRestorableDraft,
            autosaveUpdatedAt,
            onRestoreAutosave: handleRestoreAutosave,
            onDiscardAutosave: discardAutosave
        },
        data: {
            draft,
            categoryTree,
            revisions,
            contentStats,
            currentCoverUrl: draft.cover,
            editor
        }
    };

    return <PostEditorSection {...groupedProps} />;
};

export default PostEditor;

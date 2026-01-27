
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { useTiptapEditor } from '../../hooks/useTiptapEditor';
import PostEditorSection from './sections/PostEditorSection';
import { useEditorImageControls } from '../../hooks/useEditorImageControls';
import { uploadLocalImage } from '../../api/uploadApi';
import type { Post, PostStatus } from '../../data/blogData';
import { stripHtml } from '../../utils/postContent';
import type { CategoryTreeResult } from '../../utils/categoryTree';
import { usePostForm, toDraft } from '../../hooks/usePostForm';
import { useAutosave } from '../../hooks/useAutosave';
import { usePostPersistence } from '../../hooks/usePostPersistence';

const MAX_UPLOAD_MB = 8;

interface PostEditorProps {
    post: Post | null;
    onSaveSuccess: (post: Post) => void;
    onDeleteSuccess: () => void;
    categoryTree: CategoryTreeResult;
    onLoadCategories: () => void | Promise<void>;
}

const PostEditor: React.FC<PostEditorProps> = ({ post, onSaveSuccess, onDeleteSuccess, categoryTree, onLoadCategories }) => {
    const activeId = post?.id || null;

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
    const editorRef = useRef<Editor | null>(null);

    // 2. Auto-save Logic (extracted)
    const { clearAutosave, handleRestoreAutosave } = useAutosave({
        activeId,
        draft,
        setDraft,
        setNotice,
        onLoadDraft: () => toDraft(post || undefined)
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
        onSaveSuccess,
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
        contentHtml: draft.contentHtml || '',
        setDraft,
        handleSelectionUpdate,
        handlePaste,
        handleDrop
    });

    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    // Sync editor content when draft changes
    useEffect(() => {
        if (!editor) return;
        const safeHtml = draft.contentHtml?.trim() ? draft.contentHtml : '';
        if (editor.getHTML() !== safeHtml) {
            editor.commands.setContent(safeHtml, false);
        }
    }, [editor, activeId, draft.contentHtml]); // activeId ensures swap, draft.contentHtml ensures sync

    const contentStats = useMemo(() => {
        const plainText = stripHtml(draft.contentHtml || '');
        const readingMinutes = Math.max(1, Math.ceil(plainText.length / 450));
        return {
            chars: plainText.length,
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
        } catch (error) {
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

    const groupedProps = {
        editorHandlers: {
            onTitleChange: handleTitleChange,
            onStatusChange: handleStatusChange,
            onSave: (message?: string, statusOverride?: PostStatus) => void handleSave(message, statusOverride),
            onDelete: () => void handleDelete(),
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
            onSetCoverFromContent: handleSetCoverFromContent
        },
        uiState: {
            notice,
            saving,
            activeId,
            tagInput,
            previewMode,
            uploadingImage,
            uploadError,
            onNoticeClick: notice.includes('복구') ? handleRestoreAutosave : undefined
        },
        data: {
            draft,
            categoryTree,
            contentStats,
            currentCoverUrl: draft.cover,
            editor
        }
    };

    return <PostEditorSection {...groupedProps} />;
};

export default PostEditor;

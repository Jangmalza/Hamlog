import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { createLowlight, common } from 'lowlight';
import { SlashCommand, getSuggestionItems, renderItems } from '../editor/extensions/slashCommand';
import AdminNav from '../components/admin/AdminNav';
import AdminSidebar from '../components/admin/AdminSidebar';
import CategorySection from '../components/admin/sections/CategorySection';
import DashboardSection from '../components/admin/sections/DashboardSection';
import PostEditorSection from '../components/admin/sections/PostEditorSection';
import ProfileSection from '../components/admin/sections/ProfileSection';
import { useCategoryManagement } from '../hooks/useCategoryManagement';
import { useDraftAutosave } from '../hooks/useDraftAutosave';
import { useEditorImageControls } from '../hooks/useEditorImageControls';
import { usePostFilter } from '../hooks/usePostFilter';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import { uploadLocalImage } from '../api/uploadApi';
import { usePostStore } from '../store/postStore';
import { Sun, Moon } from 'lucide-react';
import type { Post, PostInput, PostStatus } from '../data/blogData';
import type { AdminSection, PostDraft } from '../types/admin';
import { formatDateTimeLocal, toIsoDateTime } from '../utils/adminDate';
import {
  DEFAULT_CATEGORY,
  normalizeDraftCategory
} from '../utils/category';
import { stripHtml, sectionsToHtml } from '../utils/postContent';
import { slugify } from '../utils/slugify';
import { normalizePostStatus } from '../utils/postStatus';
import { FontSize } from '../editor/extensions/fontSize';

const MAX_UPLOAD_MB = 8;
const lowlight = createLowlight(common);
const ADMIN_SECTIONS: Array<{ key: AdminSection; label: string }> = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'posts', label: '글 관리' },
  { key: 'categories', label: '카테고리' },
  { key: 'profile', label: '자기소개' }
];

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: 'full',
        parseHTML: element => element.getAttribute('data-size') || 'full',
        renderHTML: attributes => ({
          'data-size': attributes.size
        })
      },
      dataWidth: {
        default: null,
        parseHTML: element => element.getAttribute('data-width'),
        renderHTML: attributes =>
          attributes.dataWidth ? { 'data-width': attributes.dataWidth } : {}
      },
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes =>
          attributes.width ? { width: attributes.width } : {}
      },
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes =>
          attributes.style ? { style: attributes.style } : {}
      }
    };
  }
});

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

const AdminPage: React.FC = () => {
  const posts = usePostStore(state => state.posts);
  const loading = usePostStore(state => state.loading);
  const error = usePostStore(state => state.error);
  const hasLoaded = usePostStore(state => state.hasLoaded);
  const fetchPosts = usePostStore(state => state.fetchPosts);
  const addPost = usePostStore(state => state.addPost);
  const updatePost = usePostStore(state => state.updatePost);
  const deletePost = usePostStore(state => state.deletePost);



  const { theme, toggleTheme } = useTheme();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PostDraft>(() => toDraft());
  const [slugTouched, setSlugTouched] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('posts');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  const {
    restoreCandidate,
    autosavePaused,
    setAutosavePaused,
    lastAutosavedAt,
    clearAutosave,
    restoreDraft,
    discardRestore
  } = useDraftAutosave({ draft, activeId });

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

  const setDraftCategory = useCallback((category: string) => {
    setDraft(prev => ({ ...prev, category }));
  }, []);

  const {
    categoriesLoading,
    categorySaving,
    categoriesError,
    setCategoriesError,
    loadCategories,
    categoryInput,
    parentCategoryId,
    setCategoryInput,
    setParentCategoryId,
    categoryTree,
    parentOptions,
    managedCategoryIds,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleReorderCategory
  } = useCategoryManagement({
    posts,
    draftCategory: draft.category,
    setDraftCategory,
    refreshPosts: fetchPosts,
    setNotice
  });

  const {
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    page,
    setPage,
    filteredPosts
  } = usePostFilter({ posts, categoryTree });

  const {
    profileDraft,
    stackInput,
    loading: profileLoading,
    saving: profileSaving,
    error: profileError,
    notice: profileNotice,
    loadProfile,
    saveProfile,
    updateProfileField,
    updateProfileSocial,
    setStackInput
  } = useProfile();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        codeBlock: false
      }),
      CodeBlockLowlight.configure({ lowlight }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FontSize,
      Underline,
      LinkExtension.configure({
        openOnClick: false
      }),
      CustomImage,
      Placeholder.configure({
        placeholder: '내용을 입력하세요...'
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      SlashCommand.configure({
        suggestion: {
          items: getSuggestionItems,
          render: renderItems,
        },
      })
    ],
    content: draft.contentHtml || '',
    onUpdate: ({ editor }) => {
      setDraft(prev => ({ ...prev, contentHtml: editor.getHTML() }));
    },
    onSelectionUpdate: ({ editor }) => {
      handleSelectionUpdate(editor);
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor border-none shadow-none outline-none ring-0 focus:ring-0 focus:outline-none'
      },
      handlePaste,
      handleDrop
    }
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (!hasLoaded && !loading) {
      void fetchPosts();
    }
  }, [hasLoaded, loading, fetchPosts]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!activeId && posts.length > 0) {
      const nextDraft = toDraft(posts[0]);
      setActiveId(posts[0].id);
      setDraft(nextDraft);
      setSlugTouched(true);
      setTagInput('');
      syncEditorContent(nextDraft.contentHtml);
    }
  }, [activeId, posts]);

  useEffect(() => {
    if (!editor) return;
    syncEditorContent(draft.contentHtml);
  }, [editor, activeId]);

  const contentStats = useMemo(() => {
    const plainText = stripHtml(draft.contentHtml || '');
    const readingMinutes = Math.max(1, Math.ceil(plainText.length / 450));
    return {
      chars: plainText.length,
      readingMinutes
    };
  }, [draft.contentHtml]);

  const dashboardStats = useDashboardStats(posts, categoryTree);

  const syncEditorContent = (html: string) => {
    if (!editor) return;
    const safeHtml = html?.trim() ? html : '';
    if (editor.getHTML() !== safeHtml) {
      editor.commands.setContent(safeHtml, false);
    }
  };

  const handleSelect = (post: Post) => {
    const nextDraft = toDraft(post);
    setActiveId(post.id);
    setDraft(nextDraft);
    setSlugTouched(true);
    setNotice('');
    setTagInput('');
    setPreviewMode(false);
    syncEditorContent(nextDraft.contentHtml);
  };

  const handleNew = () => {
    const nextDraft = toDraft();
    setActiveId(null);
    setDraft(nextDraft);
    setSlugTouched(false);
    setNotice('');
    setTagInput('');
    setPreviewMode(false);
    syncEditorContent(nextDraft.contentHtml);
  };

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

  const handleRestoreDraft = () => {
    const restored = restoreDraft();
    if (!restored) return;
    setDraft(restored.draft);
    setSlugTouched(true);
    setNotice('임시 저장된 초안을 복구했습니다.');
    setTagInput('');
    syncEditorContent(restored.draft.contentHtml);
  };

  const handleDiscardRestore = () => {
    discardRestore();
  };

  const handleReset = () => {
    const nextDraft = activeId
      ? toDraft(posts.find(post => post.id === activeId))
      : toDraft();
    setDraft(nextDraft);
    setSlugTouched(Boolean(activeId));
    setNotice('');
    setTagInput('');
    syncEditorContent(nextDraft.contentHtml);
    clearAutosave(activeId);
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

  const handleSave = async (successMessage?: string, statusOverride?: PostStatus) => {
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

    const slugTaken = posts.some(post => post.slug === slug && post.id !== activeId);
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
      clearAutosave(activeId);
      setActiveId(saved.id);
      const nextDraft = toDraft(saved);
      setDraft(nextDraft);
      setSlugTouched(true);
      setAutosavePaused(false);
      setTagInput('');
      syncEditorContent(nextDraft.contentHtml);
      void loadCategories();
    } catch (error) {
      if (error instanceof Error && error.message) {
        setNotice(error.message);
      } else {
        setNotice('저장에 실패했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeId) return;
    const activePost = posts.find(post => post.id === activeId);
    if (!activePost) return;

    const confirmed = window.confirm(`"${activePost.title}" 글을 삭제할까요? 되돌릴 수 없습니다.`);
    if (!confirmed) return;

    setSaving(true);
    try {
      const remaining = posts.filter(post => post.id !== activeId);
      await deletePost(activeId);
      clearAutosave(activeId);

      if (remaining[0]) {
        const nextDraft = toDraft(remaining[0]);
        setActiveId(remaining[0].id);
        setDraft(nextDraft);
        setSlugTouched(true);
        setTagInput('');
        syncEditorContent(nextDraft.contentHtml);
      } else {
        const nextDraft = toDraft();
        setActiveId(null);
        setDraft(nextDraft);
        setSlugTouched(false);
        setTagInput('');
        syncEditorContent(nextDraft.contentHtml);
      }

      setNotice('글이 삭제되었습니다.');
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

  const handleDashboardSelect = (post: Post) => {
    handleSelect(post);
    setActiveSection('posts');
  };

  const showPostSidebar = activeSection === 'posts';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      <header className="sticky top-0 z-10 border-b border-[color:var(--border)] bg-[var(--surface-overlay)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="font-display text-xl font-bold text-[var(--accent)]">HamLog Admin</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors"
              aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Link
              to="/"
              className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--accent)]"
            >
              사이트로 돌아가기
            </Link>
          </div>
        </div>
      </header>
      <main
        className={`mx-auto grid max-w-6xl gap-8 px-4 py-10 ${showPostSidebar ? 'lg:grid-cols-[320px_1fr]' : 'lg:grid-cols-1'}`}
      >
        <div className="col-span-full">
          <AdminNav
            activeSection={activeSection}
            sections={ADMIN_SECTIONS}
            onChange={(section) => setActiveSection(section)}
          />
        </div>
        <AdminSidebar
          show={showPostSidebar}
          searchQuery={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          filterStatus={filterStatus}
          onFilterStatusChange={(value) => {
            setFilterStatus(value);
            setPage(1);
          }}
          filterCategory={filterCategory}
          onFilterCategoryChange={(value) => {
            setFilterCategory(value);
            setPage(1);
          }}
          page={page}
          onPageChange={setPage}
          onNew={handleNew}
          saving={saving}
          onSelect={handleSelect}
          filteredPosts={filteredPosts}
          activeId={activeId}
          loading={loading}
          error={error}
          onReload={fetchPosts}
          totalCount={filteredPosts.length}
          statusCount={dashboardStats.statusCount}
          categories={categoryTree.allNames}
          restoreCandidate={restoreCandidate}
          onRestore={handleRestoreDraft}
          onDiscardRestore={handleDiscardRestore}
          editor={editor}
        />

        <section className="space-y-6">


          {activeSection === 'dashboard' && (
            <DashboardSection
              stats={dashboardStats}
              totalPosts={posts.length}
              onSelectPost={handleDashboardSelect}
            />
          )}

          {activeSection === 'profile' && (
            <ProfileSection
              profileDraft={profileDraft}
              stackInput={stackInput}
              profileLoading={profileLoading}
              profileSaving={profileSaving}
              profileError={profileError}
              profileNotice={profileNotice}
              onProfileChange={updateProfileField}
              onProfileSocialChange={updateProfileSocial}
              onStackInputChange={(value) => setStackInput(value)}
              onSave={() => void saveProfile()}
              onReload={() => void loadProfile()}
            />
          )}

          {activeSection === 'categories' && (
            <CategorySection
              categoryTree={categoryTree}
              managedCategoryIds={managedCategoryIds}
              categoriesLoading={categoriesLoading}
              categoriesError={categoriesError}
              categoryInput={categoryInput}
              parentCategoryId={parentCategoryId}
              parentOptions={parentOptions}
              onCategoryInputChange={(value) => {
                setCategoryInput(value);
                setCategoriesError('');
              }}
              onParentCategoryChange={(value) => {
                setParentCategoryId(value);
                setCategoriesError('');
              }}
              onAddCategory={() => void handleAddCategory()}
              onUpdateCategory={(category, updates) =>
                void handleUpdateCategory(category, updates)
              }
              onReorderCategory={(parentId, orderedIds) =>
                void handleReorderCategory(parentId, orderedIds)
              }
              onDeleteCategory={(category) => void handleDeleteCategory(category)}
              onReload={() => void loadCategories()}
              categorySaving={categorySaving}
              defaultCategory={DEFAULT_CATEGORY}
            />
          )}

          {activeSection === 'posts' && (
            <PostEditorSection
              draft={draft}
              categoryTree={categoryTree}
              contentStats={contentStats}
              notice={notice}
              saving={saving}
              activeId={activeId}
              lastAutosavedAt={lastAutosavedAt}
              autosavePaused={autosavePaused}
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
              onReset={() => handleReset()}
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
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminPage;

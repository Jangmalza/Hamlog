import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import AdminNav from '../components/admin/AdminNav';
import AdminSidebar from '../components/admin/AdminSidebar';
import CategorySection from '../components/admin/sections/CategorySection';
import DashboardSection from '../components/admin/sections/DashboardSection';
import PostEditorSection from '../components/admin/sections/PostEditorSection';
import ProfileSection from '../components/admin/sections/ProfileSection';
import { useCategories } from '../hooks/useCategories';
import { useProfile } from '../hooks/useProfile';
import { uploadLocalImage } from '../api/uploadApi';
import { usePostStore } from '../store/postStore';
import type { Post, PostInput, PostStatus } from '../data/blogData';
import type { AdminSection, DashboardStats, PostDraft } from '../types/admin';
import { formatAutosaveTime, formatDateTimeLocal, toIsoDateTime } from '../utils/adminDate';
import {
  normalizeCategoryKey,
  normalizeCategoryName,
  normalizeDraftCategory,
  sortCategories
} from '../utils/category';
import { extractImageWidth, parseImageWidthInput } from '../utils/editorImage';
import { stripHtml, sectionsToHtml } from '../utils/postContent';
import { slugify } from '../utils/slugify';
import {
  getScheduledTimestamp,
  isPostVisible,
  normalizePostStatus
} from '../utils/postStatus';

interface StoredDraft {
  draft: PostDraft;
  updatedAt: number;
  activeId: string | null;
}

const STORAGE_KEY_PREFIX = 'hamlog:editor:draft:';
const MAX_UPLOAD_MB = 8;
const DEFAULT_CATEGORY = '미분류';
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

const getStorageKey = (postId: string | null) =>
  `${STORAGE_KEY_PREFIX}${postId ?? 'new'}`;

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

  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PostDraft>(() => toDraft());
  const [slugTouched, setSlugTouched] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('posts');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [imageWidthInput, setImageWidthInput] = useState('');
  const [imageWidthError, setImageWidthError] = useState('');
  const [restoreCandidate, setRestoreCandidate] = useState<StoredDraft | null>(null);
  const [autosavePaused, setAutosavePaused] = useState(false);
  const [lastAutosavedAt, setLastAutosavedAt] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    categories,
    loading: categoriesLoading,
    saving: categorySaving,
    error: categoriesError,
    setError: setCategoriesError,
    loadCategories,
    addCategory,
    removeCategory
  } = useCategories();

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
        }
      }),
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
      })
    ],
    content: draft.contentHtml || '',
    onUpdate: ({ editor }) => {
      setDraft(prev => ({ ...prev, contentHtml: editor.getHTML() }));
    },
    onSelectionUpdate: ({ editor }) => {
      if (!editor.isActive('image')) {
        setImageWidthInput('');
        setImageWidthError('');
        return;
      }
      const attrs = editor.getAttributes('image') as Record<string, string>;
      setImageWidthInput(extractImageWidth(attrs));
      setImageWidthError('');
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor'
      }
    }
  });

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
    if (typeof window === 'undefined') return;
    const key = getStorageKey(activeId);
    const raw = window.localStorage.getItem(key);
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
  }, [activeId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (autosavePaused) return;
    const key = getStorageKey(activeId);
    const timer = window.setTimeout(() => {
      const payload: StoredDraft = {
        draft,
        updatedAt: Date.now(),
        activeId
      };
      window.localStorage.setItem(key, JSON.stringify(payload));
      setLastAutosavedAt(payload.updatedAt);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [draft, activeId, autosavePaused]);

  useEffect(() => {
    if (!editor) return;
    syncEditorContent(draft.contentHtml);
  }, [editor, activeId]);

  const availableCategories = useMemo(() => {
    const categoryMap = new Map<string, string>();
    categories.forEach(category => {
      const normalized = normalizeDraftCategory(category, DEFAULT_CATEGORY);
      const key = normalizeCategoryKey(normalized);
      if (!categoryMap.has(key)) {
        categoryMap.set(key, normalized);
      }
    });
    posts.forEach(post => {
      const normalized = normalizeDraftCategory(post.category ?? '', DEFAULT_CATEGORY);
      const key = normalizeCategoryKey(normalized);
      if (!categoryMap.has(key)) {
        categoryMap.set(key, normalized);
      }
    });
    const defaultKey = normalizeCategoryKey(DEFAULT_CATEGORY);
    if (!categoryMap.has(defaultKey)) {
      categoryMap.set(defaultKey, DEFAULT_CATEGORY);
    }
    return sortCategories(Array.from(categoryMap.values()));
  }, [categories, posts]);

  const managedCategories = useMemo(() => {
    if (categories.length === 0) {
      return availableCategories;
    }
    const categoryMap = new Map<string, string>();
    categories.forEach(category => {
      const normalized = normalizeDraftCategory(category, DEFAULT_CATEGORY);
      const key = normalizeCategoryKey(normalized);
      if (!categoryMap.has(key)) {
        categoryMap.set(key, normalized);
      }
    });
    const defaultKey = normalizeCategoryKey(DEFAULT_CATEGORY);
    if (!categoryMap.has(defaultKey)) {
      categoryMap.set(defaultKey, DEFAULT_CATEGORY);
    }
    return sortCategories(Array.from(categoryMap.values()));
  }, [categories, availableCategories]);

  const categoryUsage = useMemo(() => {
    const usage = new Map<string, number>();
    posts.forEach(post => {
      const normalized = normalizeDraftCategory(post.category ?? '', DEFAULT_CATEGORY);
      const key = normalizeCategoryKey(normalized);
      usage.set(key, (usage.get(key) ?? 0) + 1);
    });
    return usage;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(post => {
      const fields = [
        post.title,
        post.summary,
        post.slug,
        post.tags.join(' '),
        post.series ?? '',
        post.category ?? ''
      ];
      return fields.some(text => text.toLowerCase().includes(q));
    });
  }, [posts, searchQuery]);

  const contentStats = useMemo(() => {
    const plainText = stripHtml(draft.contentHtml || '');
    const readingMinutes = Math.max(1, Math.ceil(plainText.length / 450));
    return {
      chars: plainText.length,
      readingMinutes
    };
  }, [draft.contentHtml]);

  const dashboardStats = useMemo<DashboardStats>(() => {
    const now = Date.now();
    const statusCount: Record<PostStatus, number> = {
      draft: 0,
      scheduled: 0,
      published: 0
    };
    const tagSet = new Set<string>();
    const seriesSet = new Set<string>();
    const categoryMap = new Map<string, number>();
    const visiblePosts: Post[] = [];
    const scheduledQueue: Array<{ post: Post; timestamp: number }> = [];

    posts.forEach(post => {
      const status = normalizePostStatus(post.status);
      statusCount[status] += 1;
      const category = normalizeDraftCategory(post.category ?? '', DEFAULT_CATEGORY);
      categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
      post.tags.forEach(tag => tagSet.add(tag));
      if (post.series) seriesSet.add(post.series);
      if (isPostVisible(post, now)) {
        visiblePosts.push(post);
      }
      if (status === 'scheduled') {
        const timestamp = getScheduledTimestamp(post.scheduledAt);
        if (timestamp && timestamp > now) {
          scheduledQueue.push({ post, timestamp });
        }
      }
    });

    const topCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const upcomingScheduled = scheduledQueue
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, 3)
      .map(item => item.post);

    const recentPublished = [...visiblePosts]
      .sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      .slice(0, 3);

    return {
      statusCount,
      visibleCount: visiblePosts.length,
      tagsCount: tagSet.size,
      categoriesCount: categoryMap.size,
      seriesCount: seriesSet.size,
      topCategories,
      upcomingScheduled,
      recentPublished
    };
  }, [posts]);

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

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setDraft(prev => ({ ...prev, slug: value }));
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

  const handleAddCategory = async () => {
    if (categorySaving) return;
    const normalized = normalizeCategoryName(categoryInput);
    if (!normalized) {
      setCategoriesError('카테고리 이름을 입력하세요.');
      return;
    }
    const key = normalizeCategoryKey(normalized);
    if (key === normalizeCategoryKey(DEFAULT_CATEGORY)) {
      setCategoriesError('기본 카테고리는 자동으로 포함됩니다.');
      setCategoryInput('');
      return;
    }
    const exists = availableCategories.some(
      category => normalizeCategoryKey(category) === key
    );
    if (exists) {
      setCategoriesError('이미 존재하는 카테고리입니다.');
      setCategoryInput('');
      return;
    }
    setCategoriesError('');
    try {
      await addCategory(normalized);
      setCategoryInput('');
      setNotice('카테고리를 추가했습니다.');
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : '카테고리 추가에 실패했습니다.';
      setCategoriesError(message);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (categorySaving) return;
    const normalized = normalizeDraftCategory(category, DEFAULT_CATEGORY);
    const key = normalizeCategoryKey(normalized);
    if (key === normalizeCategoryKey(DEFAULT_CATEGORY)) {
      setCategoriesError('기본 카테고리는 삭제할 수 없습니다.');
      return;
    }
    const count = categoryUsage.get(key) ?? 0;
    const message =
      count > 0
        ? `"${normalized}" 카테고리를 삭제하면 ${count}개의 글이 미분류로 이동합니다. 계속할까요?`
        : `"${normalized}" 카테고리를 삭제할까요?`;
    if (!window.confirm(message)) return;
    setCategoriesError('');
    try {
      await removeCategory(normalized);
      if (normalizeCategoryKey(draft.category) === key) {
        setDraft(prev => ({ ...prev, category: DEFAULT_CATEGORY }));
      }
      void fetchPosts();
      setNotice('카테고리를 삭제했습니다.');
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : '카테고리 삭제에 실패했습니다.';
      setCategoriesError(message);
    }
  };

  const clearAutosave = (postId: string | null) => {
    if (typeof window === 'undefined') return;
    const key = getStorageKey(postId);
    window.localStorage.removeItem(key);
  };

  const handleRestoreDraft = () => {
    if (!restoreCandidate) return;
    setDraft(restoreCandidate.draft);
    setSlugTouched(true);
    setNotice('임시 저장된 초안을 복구했습니다.');
    setRestoreCandidate(null);
    setAutosavePaused(false);
    setTagInput('');
    syncEditorContent(restoreCandidate.draft.contentHtml);
  };

  const handleDiscardRestore = () => {
    clearAutosave(activeId);
    setRestoreCandidate(null);
    setAutosavePaused(false);
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

  const applyImageWidth = () => {
    if (!editor) return;
    if (!editor.isActive('image')) return;
    const parsed = parseImageWidthInput(imageWidthInput);
    if (parsed.kind === 'error') {
      setImageWidthError(parsed.message);
      return;
    }

    if (parsed.kind === 'clear') {
      editor
        .chain()
        .focus()
        .updateAttributes('image', {
          dataWidth: null,
          width: null,
          style: null,
          size: 'full'
        })
        .run();
      setImageWidthInput('');
      setImageWidthError('');
      return;
    }

    editor
      .chain()
      .focus()
      .updateAttributes('image', {
        dataWidth: parsed.dataWidth,
        width: parsed.widthAttr,
        style: `width: ${parsed.cssValue};`,
        size: 'custom'
      })
      .run();
    setImageWidthInput(parsed.displayValue ?? parsed.cssValue);
    setImageWidthError('');
  };

  const clearImageWidth = () => {
    setImageWidthInput('');
    setImageWidthError('');
    if (!editor || !editor.isActive('image')) return;
    editor
      .chain()
      .focus()
      .updateAttributes('image', {
        dataWidth: null,
        width: null,
        style: null,
        size: 'full'
      })
      .run();
  };

  const handleImageUpload = async (file: File) => {
    setUploadError('');
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setUploadError(`이미지는 ${MAX_UPLOAD_MB}MB 이하만 가능합니다.`);
      return;
    }

    if (!editor) return;
    setUploadingImage(true);
    try {
      const { url } = await uploadLocalImage(file);
      const imageAttrs = { src: url, alt: file.name, size: 'full' };
      editor
        .chain()
        .focus()
        .setImage(imageAttrs)
        .run();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : '이미지 업로드에 실패했습니다.';
      setUploadError(message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToolbarImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleInsertImageUrl = () => {
    if (!editor) return;
    const url = window.prompt('이미지 URL을 입력하세요');
    if (!url) return;
    const imageAttrs = { src: url, size: 'full' };
    editor.chain().focus().setImage(imageAttrs).run();
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
    <div className="min-h-screen text-[var(--text)]">
      <header className="border-b border-[color:var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
              관리자 워크스페이스
            </p>
            <h1 className="font-display text-2xl font-semibold">블로그 에디터</h1>
          </div>
          <Link
            to="/"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--accent-strong)]"
          >
            사이트로 돌아가기
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[320px_1fr]">
        {showPostSidebar && restoreCandidate && (
          <div className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text)] lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  임시 저장본 발견
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {lastAutosavedAt
                    ? `${formatAutosaveTime(lastAutosavedAt)}에 저장된 초안이 있습니다.`
                    : '저장된 초안이 있습니다.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRestoreDraft}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                >
                  복구
                </button>
                <button
                  type="button"
                  onClick={handleDiscardRestore}
                  className="rounded-full border border-[color:var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text)]"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}

        <AdminSidebar
          show={showPostSidebar}
          searchQuery={searchQuery}
          onSearchChange={(value) => setSearchQuery(value)}
          onNew={handleNew}
          saving={saving}
          onSelect={handleSelect}
          filteredPosts={filteredPosts}
          activeId={activeId}
          loading={loading}
          error={error}
          hasLoaded={hasLoaded}
          onReload={() => void fetchPosts()}
          totalCount={posts.length}
          statusCount={dashboardStats.statusCount}
          defaultCategory={DEFAULT_CATEGORY}
        />

        <section className="space-y-6">
          <AdminNav
            activeSection={activeSection}
            sections={ADMIN_SECTIONS}
            onChange={(section) => setActiveSection(section)}
          />

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
              managedCategories={managedCategories}
              categoryUsage={categoryUsage}
              categoriesLoading={categoriesLoading}
              categoriesError={categoriesError}
              categoryInput={categoryInput}
              onCategoryInputChange={(value) => {
                setCategoryInput(value);
                setCategoriesError('');
              }}
              onAddCategory={() => void handleAddCategory()}
              onDeleteCategory={(category) => void handleDeleteCategory(category)}
              onReload={() => void loadCategories()}
              categorySaving={categorySaving}
              defaultCategory={DEFAULT_CATEGORY}
            />
          )}

          {activeSection === 'posts' && (
            <PostEditorSection
              draft={draft}
              availableCategories={availableCategories}
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
              onSlugChange={handleSlugChange}
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

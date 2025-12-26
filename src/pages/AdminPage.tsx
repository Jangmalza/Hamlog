import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../components/admin/AdminNav';
import AdminSidebar from '../components/admin/AdminSidebar';
import CategorySection from '../components/admin/sections/CategorySection';
import DashboardSection from '../components/admin/sections/DashboardSection';
import ProfileSection from '../components/admin/sections/ProfileSection';
import PostEditor from '../components/admin/PostEditor';
import { useCategoryManagement } from '../hooks/useCategoryManagement';
import { usePostFilter } from '../hooks/usePostFilter';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import { usePostStore } from '../store/postStore';
import { Sun, Moon } from 'lucide-react';
import type { Post, PostStatus } from '../data/blogData';
import type { AdminSection } from '../types/admin';
import { DEFAULT_CATEGORY } from '../utils/category';

const ADMIN_SECTIONS: Array<{ key: AdminSection; label: string }> = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'posts', label: '글 관리' },
  { key: 'categories', label: '카테고리' },
  { key: 'profile', label: '자기소개' }
];

const AdminPage: React.FC = () => {
  const posts = usePostStore(state => state.posts);
  const loading = usePostStore(state => state.loading);
  const error = usePostStore(state => state.error);
  const hasLoaded = usePostStore(state => state.hasLoaded);
  const fetchPosts = usePostStore(state => state.fetchPosts);

  const { theme, toggleTheme } = useTheme();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>('posts');

  // Category Management (still needed for Sidebar & Category Manager)
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
    draftCategory: '', // Not needed for page level
    setDraftCategory: () => { }, // Not needed
    refreshPosts: fetchPosts,
    setNotice: () => { } // Handled in components
  });

  // Post Filter (for Sidebar)
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

  // Profile Management
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

  // Initial Data Load
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

  // If no active post, select the first one or prepare for new
  useEffect(() => {
    if (!activeId && posts.length > 0 && activeSection === 'posts') {
      // Optional: auto-select first post if desired, or keep as 'new'
      // setActiveId(posts[0].id);
    }
  }, [activeId, posts, activeSection]);

  const dashboardStats = useDashboardStats(posts, categoryTree);

  const handleSelect = (post: Post) => {
    setActiveId(post.id);
  };

  const handleNew = () => {
    setActiveId(null);
  };

  // Switch to post tab when clicking dashboard item
  const handleDashboardSelect = (post: Post) => {
    setActiveId(post.id);
    setActiveSection('posts');
  };

  const handleSaveSuccess = (savedPost: Post) => {
    setActiveId(savedPost.id);
  };

  const handleDeleteSuccess = () => {
    setActiveId(null);
  };

  const showPostSidebar = activeSection === 'posts';
  const activePost = activeId ? posts.find(p => p.id === activeId) || null : null;

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
            setFilterStatus(value as PostStatus | 'all');
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
          saving={false} // Loading state handled in editor
          onSelect={handleSelect}
          filteredPosts={filteredPosts}
          activeId={activeId}
          loading={loading}
          error={error}
          onReload={fetchPosts}
          totalCount={filteredPosts.length}
          statusCount={dashboardStats.statusCount}
          categories={categoryTree.allNames}
          editor={null} // Editor instance not needed here
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
              onAddCategory={(name, parentId) => void handleAddCategory(name, parentId)}
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
            <PostEditor
              post={activePost}
              onSaveSuccess={handleSaveSuccess}
              onDeleteSuccess={handleDeleteSuccess}
              categoryTree={categoryTree}
              onLoadCategories={loadCategories}
            />
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminPage;

import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';
import AdminGuard from './pages/AdminGuard';
import HomePage from './pages/HomePage';

// Lazy load pages
const PostPage = lazy(() => import('./pages/PostPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
    <LoadingSpinner message="페이지 불러오는 중..." />
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/posts/:slug',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <PostPage />
      </Suspense>
    )
  },
  {
    path: '/admin',
    element: (
      <AdminGuard>
        <Suspense fallback={<LoadingFallback />}>
          <AdminPage />
        </Suspense>
      </AdminGuard>
    )
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

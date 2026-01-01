import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import LoadingSpinner from './components/LoadingSpinner'
import AdminGuard from './pages/AdminGuard'

// Lazy load pages
const App = lazy(() => import('./App'))
const PostPage = lazy(() => import('./pages/PostPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
    <LoadingSpinner message="페이지 불러오는 중..." />
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    )
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
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

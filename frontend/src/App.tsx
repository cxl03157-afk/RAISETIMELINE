import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from './utils/storage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TimelinePage from './pages/TimelinePage'
import PostDetailPage from './pages/PostDetailPage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import FollowListPage from './pages/FollowListPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  if (isAuthenticated()) {
    return <Navigate to="/home" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <RedirectIfAuth>
              <LoginPage />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuth>
              <RegisterPage />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/home"
          element={
            <RequireAuth>
              <TimelinePage />
            </RequireAuth>
          }
        />
        <Route
          path="/posts/:id"
          element={
            <RequireAuth>
              <PostDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/users/:username"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/users/:username/following"
          element={
            <RequireAuth>
              <FollowListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/users/:username/followers"
          element={
            <RequireAuth>
              <FollowListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/search"
          element={
            <RequireAuth>
              <SearchPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

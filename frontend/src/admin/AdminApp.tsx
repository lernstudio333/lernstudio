import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from './AdminLayout';
import ContentPage from './pages/content/ContentPage';
import LessonWorkspace from './pages/content/LessonWorkspace';
import MediaPage from './pages/media/MediaPage';
import UsersPage from './pages/users/UsersPage';
import LearningsPage from './pages/learnings/LearningsPage';

function AdminApp() {
  const { isLoggedIn, isInitializing, role } = useAuth();

  if (isInitializing) return null;
  if (!isLoggedIn || (role !== 'admin' && role !== 'course_editor')) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="content" replace />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="lessons/:lessonId" element={<LessonWorkspace />} />
        <Route path="lessons/:lessonId/cards/:cardId" element={<LessonWorkspace />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="users" element={<UsersPage />} />
        {role === 'admin' && (
          <Route path="learnings" element={<LearningsPage />} />
        )}
      </Route>
    </Routes>
  );
}

export default AdminApp;

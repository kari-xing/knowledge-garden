import { useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/common/Layout';
import Toaster from './components/common/Toaster';
import QuickCapture from './components/common/QuickCapture';
import AuthPage from './pages/AuthPage';
import GardenPage from './pages/GardenPage';
import NotesPage from './pages/NotesPage';
import NoteEditorPage from './pages/NoteEditorPage';
import NoteDetailPage from './pages/NoteDetailPage';
import GraphPage from './pages/GraphPage';
import SearchPage from './pages/SearchPage';
import TagsPage from './pages/TagsPage';
import SettingsPage from './pages/SettingsPage';

/** 登录守卫：未登录跳转到 /login */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

/** 主应用外壳：侧边栏 + 全局快速捕获 + Toast */
function AppShell() {
  const [captureOpen, setCaptureOpen] = useState(false);
  return (
    <RequireAuth>
      <Layout onOpenQuickCapture={() => setCaptureOpen(true)} />
      <QuickCapture open={captureOpen} onClose={() => setCaptureOpen(false)} />
      <Toaster />
    </RequireAuth>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route element={<AppShell />}>
        <Route path="/garden" element={<GardenPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/notes/new" element={<NoteEditorPage />} />
        <Route path="/notes/:id" element={<NoteDetailPage />} />
        <Route path="/notes/:id/edit" element={<NoteEditorPage />} />
        <Route path="/graph" element={<GraphPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/garden" replace />} />
    </Routes>
  );
}

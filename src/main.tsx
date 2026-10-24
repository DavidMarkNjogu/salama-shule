import { StrictMode, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { AuthProvider, useAuth } from './lib/auth';
import { Layout } from './components';
import Login from './Login';
import Landing from './Landing';
import StudentHome from './student/StudentHome';
import UnitPage from './student/UnitPage';
import LessonPage from './student/LessonPage';
import QuizPage from './student/QuizPage';
import SyncCenter from './student/SyncCenter';
import LecturerHome from './lecturer/LecturerHome';
import AttemptDetail from './lecturer/AttemptDetail';
import Builder from './lecturer/Builder';
import './styles.css';

registerSW({ immediate: true });

function Guard({ role, children }: { role: 'student' | 'lecturer'; children: ReactElement }) {
  const { user, ready } = useAuth();
  if (!user && !ready) return <div className="center muted">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'student' ? '/student' : '/lecturer'} replace />;
  return children;
}

function Home() {
  const { user, ready } = useAuth();
  if (!user && !ready) return <div className="center muted">Loading…</div>;
  if (user) return <Navigate to={user.role === 'student' ? '/student' : '/lecturer'} replace />;
  return <Landing />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route element={<Guard role="student"><Layout /></Guard>}>
            <Route path="/student" element={<StudentHome />} />
            <Route path="/student/unit/:id" element={<UnitPage />} />
            <Route path="/student/lesson/:id" element={<LessonPage />} />
            <Route path="/student/quiz/:id" element={<QuizPage />} />
            <Route path="/student/sync" element={<SyncCenter />} />
          </Route>
          <Route element={<Guard role="lecturer"><Layout /></Guard>}>
            <Route path="/lecturer" element={<LecturerHome />} />
            <Route path="/lecturer/attempt/:id" element={<AttemptDetail />} />
            <Route path="/lecturer/builder" element={<Builder />} />
          </Route>
          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);

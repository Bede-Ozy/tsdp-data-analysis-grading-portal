import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Student Pages
import StudentLogin from './pages/student/StudentLogin';
import StudentDashboard from './pages/student/StudentDashboard';
import MarkAttendance from './pages/student/MarkAttendance';
import SubmitAssignment from './pages/student/SubmitAssignment';
import SubmitModuleProject from './pages/student/SubmitModuleProject';
import SubmitSocialMedia from './pages/student/SubmitSocialMedia';
import ViewPerformance from './pages/student/ViewPerformance';

// Coach Pages
import CoachLogin from './pages/coach/CoachLogin';
import CoachDashboard from './pages/coach/CoachDashboard';
import GenerateAttendanceCode from './pages/coach/GenerateAttendanceCode';
import GradeSubmissions from './pages/coach/GradeSubmissions';
import RecordClassActivity from './pages/coach/RecordClassActivity';
import GradeModuleProjects from './pages/coach/GradeModuleProjects';
import GradeCapstoneSprints from './pages/coach/GradeCapstoneSprints';
import GradeGroupPresentations from './pages/coach/GradeGroupPresentations';
import SoftSkillsEvaluation from './pages/coach/SoftSkillsEvaluation';
import ApproveSocialMedia from './pages/coach/ApproveSocialMedia';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageCoaches from './pages/admin/ManageCoaches';
import ViewReports from './pages/admin/ViewReports';


function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Hide sidebar on public login pages
  const isLoginPage = location.pathname.includes('/login');
  const showSidebar = isAuthenticated && !isLoginPage;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-x-hidden">
      {/* Subtle, faint & fading background pattern for login pages */}
      {isLoginPage && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
          style={{
            backgroundImage: `radial-gradient(ellipse at center, rgba(248, 250, 252, 0.35) 0%, rgba(248, 250, 252, 0.9) 100%), url('/login-bg.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.22,
          }}
        />
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          isSidebarOpen={isSidebarOpen}
        />

      <div className="flex-1 flex">
        {showSidebar && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-200 ${
          showSidebar ? 'lg:pl-72' : 'max-w-7xl mx-auto w-full'
        }`}>
          {children || <Outlet />}
        </main>
      </div>

      {/* Footer */}
      <footer className={`border-t border-brand-neutral-border py-4 text-center text-xs text-brand-neutral-muted ${
        isLoginPage ? 'bg-white/85 backdrop-blur-md' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} ITF-NECA Technical Skills Development Project (TSDP) · Powered by{' '}
            <strong className="text-brand-neutral">ShamzBridge Consult</strong>
          </p>
          <div className="flex items-center gap-3">
            <Link to="/student/login" className="hover:text-brand-primary transition-colors">Resident</Link>
            <span className="text-slate-300">·</span>
            <Link to="/coach/login" className="hover:text-brand-primary transition-colors">Coach</Link>
            <span className="text-slate-300">·</span>
            <Link to="/admin/login" className="hover:text-slate-900 font-medium transition-colors">Admin</Link>
            <span className="text-slate-300">·</span>
            <span>v1.0</span>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { user, role, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/student/login" replace />;
  }
  if (role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (role === 'coach') return <Navigate to="/coach/dashboard" replace />;
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/student/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppLayout>
          <Routes>
            {/* Root Route */}
            <Route path="/" element={<HomeRedirect />} />


            {/* Public Authentication Pages */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/coach/login" element={<CoachLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Student Portal Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attendance"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MarkAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/submit-assignment"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <SubmitAssignment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/submit-module-project"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <SubmitModuleProject />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/submit-social-media"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <SubmitSocialMedia />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/performance"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ViewPerformance />
                </ProtectedRoute>
              }
            />

            {/* Protected Coach Portal Routes */}
            <Route
              path="/coach/dashboard"
              element={
                <ProtectedRoute allowedRoles={['coach']}>
                  <CoachDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach/attendance-code"
              element={
                <ProtectedRoute allowedRoles={['coach']}>
                  <GenerateAttendanceCode />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach/grade-submissions"
              element={
                <ProtectedRoute allowedRoles={['coach']}>
                  <GradeSubmissions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach/class-activity"
              element={
                <ProtectedRoute allowedRoles={['coach']}>
                  <RecordClassActivity />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach/grade-module-projects"
              element={
                <ProtectedRoute allowedRoles={['coach']}>
                  <GradeModuleProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach/grade-capstone"
              element={
                <ProtectedRoute allowedRoles={['coach']}>
                  <GradeCapstoneSprints />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach/grade-presentations"
              element={
                <ProtectedRoute allowedRoles={['coach']}>
                  <GradeGroupPresentations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach/soft-skills"
              element={
                <ProtectedRoute allowedRoles={['coach']}>
                  <SoftSkillsEvaluation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach/approve-social-media"
              element={
                <ProtectedRoute allowedRoles={['coach']}>
                  <ApproveSocialMedia />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Portal Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/coaches"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageCoaches />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ViewReports />
                </ProtectedRoute>
              }
            />

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

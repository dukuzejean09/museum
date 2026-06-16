import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './lib/queryClient';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VisitorProvider, useVisitor } from './context/VisitorContext';
import { LanguageProvider } from './i18n/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';

// Lazy-loaded public pages
const Home = React.lazy(() => import('./pages/Home'));
const Guides = React.lazy(() => import('./pages/Guides'));
const Feedback = React.lazy(() => import('./pages/Feedback'));
const Gateway = React.lazy(() => import('./pages/Gateway'));
const Exhibitions = React.lazy(() => import('./pages/Exhibitions'));
const ExhibitionDetail = React.lazy(() => import('./pages/ExhibitionDetail'));
const SearchPage = React.lazy(() => import('./pages/Search'));
const Artifacts = React.lazy(() => import('./pages/Artifacts'));
const ArtifactDetail = React.lazy(() => import('./pages/ArtifactDetail'));
const Trails = React.lazy(() => import('./pages/Trails'));
const TrailDetail = React.lazy(() => import('./pages/TrailDetail'));
const BookVisit = React.lazy(() => import('./pages/BookVisit'));
const Stories = React.lazy(() => import('./pages/Stories'));
const StoryDetail = React.lazy(() => import('./pages/StoryDetail'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const ARScanner = React.lazy(() => import('./pages/ARScanner'));

// Lazy-loaded admin pages
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminTrails = React.lazy(() => import('./pages/admin/AdminTrails'));
const TrailForm = React.lazy(() => import('./pages/admin/TrailForm'));
const GuideProfile = React.lazy(() => import('./pages/admin/GuideProfile'));
const AdminMessages = React.lazy(() => import('./pages/admin/AdminMessages'));
const AdminBookings = React.lazy(() => import('./pages/admin/AdminBookings'));
const AdminSurveys = React.lazy(() => import('./pages/admin/AdminSurveys'));
const AdminAccessCodes = React.lazy(() => import('./pages/admin/AdminAccessCodes'));
const AdminExhibitions = React.lazy(() => import('./pages/admin/AdminExhibitions'));
const ExhibitionForm = React.lazy(() => import('./pages/admin/ExhibitionForm'));
const AdminArtifacts = React.lazy(() => import('./pages/admin/AdminArtifacts'));
const ArtifactForm = React.lazy(() => import('./pages/admin/ArtifactForm'));
const AdminStories = React.lazy(() => import('./pages/admin/AdminStories'));
const StoryForm = React.lazy(() => import('./pages/admin/StoryForm'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminGuides = React.lazy(() => import('./pages/admin/AdminGuides'));
const GuideForm = React.lazy(() => import('./pages/admin/GuideForm'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
  </div>
);

// Admin/Guide route protection — any authenticated staff
const ProtectedRoute = () => {
  const { admin, loading } = useAuth();
  if (loading) return <PageLoader />;
  return admin ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

// Admin-only route protection
const AdminOnlyRoute = () => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAdmin ? <Outlet /> : <Navigate to="/admin/dashboard" replace />;
};

// Visitor route protection — requires valid visitor token or admin/guide token
const VisitorProtectedRoute = () => {
  const { isAuthenticated, loading } = useVisitor();
  const { admin, loading: adminLoading } = useAuth();
  const location = useLocation();

  if (loading || adminLoading) return <PageLoader />;

  if (isAuthenticated || admin) {
    return <Outlet />;
  }

  return <Navigate to="/enter" state={{ from: location.pathname }} replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <VisitorProvider>
          <AuthProvider>
            <LanguageProvider>
              <BrowserRouter>
                <Toaster position="top-right" />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Gateway — always accessible */}
                    <Route path="/enter" element={<Gateway />} />

                    {/* AR Scanner — full-screen, no layout */}
                    <Route path="/ar" element={<ARScanner />} />

                    {/* Public content routes */}
                    <Route element={<Layout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/trail" element={<Navigate to="/trails" replace />} />
                      <Route path="/guides" element={<Guides />} />
                      <Route path="/feedback" element={<Feedback />} />
                      <Route path="/map" element={<Navigate to="/exhibitions" replace />} />
                      <Route path="/scanner" element={<Navigate to="/ar" replace />} />
                      <Route path="/exhibitions" element={<Exhibitions />} />
                      <Route path="/exhibitions/:id" element={<ExhibitionDetail />} />
                      <Route path="/artifacts" element={<Artifacts />} />
                      <Route path="/artifacts/:id" element={<ArtifactDetail />} />
                      <Route path="/trails" element={<Trails />} />
                      <Route path="/trails/:id" element={<TrailDetail />} />
                      <Route path="/stories" element={<Stories />} />
                      <Route path="/stories/:id" element={<StoryDetail />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/book" element={<BookVisit />} />
                      {/* Redirects for old routes */}
                      <Route path="/exhibits" element={<Navigate to="/exhibitions" replace />} />
                      <Route path="/exhibits/:id" element={<Navigate to="/exhibitions" replace />} />
                      <Route path="/museums" element={<Navigate to="/" replace />} />
                      <Route path="/museums/:slug" element={<Navigate to="/" replace />} />
                      <Route path="/collections/:id" element={<Navigate to="/exhibitions" replace />} />
                      <Route path="/ai-scanner" element={<Navigate to="/ar" replace />} />
                      <Route path="/scan" element={<Navigate to="/exhibitions" replace />} />
                      <Route path="/book-tour" element={<Navigate to="/book" replace />} />
                      <Route path="/survey" element={<Navigate to="/feedback" replace />} />
                      <Route path="/chat" element={<Navigate to="/feedback" replace />} />
                    </Route>

                    {/* Staff login (public) */}
                    <Route path="/admin/login" element={<AdminLogin />} />

                    {/* Staff protected routes (admin + guide) */}
                    <Route path="/admin" element={<ProtectedRoute />}>
                      <Route element={<AdminLayout />}>
                        {/* Shared: admin + guide */}
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="exhibitions" element={<AdminExhibitions />} />
                        <Route path="exhibitions/new" element={<ExhibitionForm />} />
                        <Route path="exhibitions/edit/:id" element={<ExhibitionForm />} />
                        <Route path="artifacts" element={<AdminArtifacts />} />
                        <Route path="artifacts/new" element={<ArtifactForm />} />
                        <Route path="artifacts/edit/:id" element={<ArtifactForm />} />
                        <Route path="stories" element={<AdminStories />} />
                        <Route path="stories/new" element={<StoryForm />} />
                        <Route path="stories/edit/:id" element={<StoryForm />} />
                        <Route path="guide-profile" element={<GuideProfile />} />
                        <Route path="trails" element={<AdminTrails />} />
                        <Route path="trails/new" element={<TrailForm />} />
                        <Route path="trails/edit/:id" element={<TrailForm />} />
                        <Route path="messages" element={<AdminMessages />} />
                        <Route path="bookings" element={<AdminBookings />} />
                        <Route path="access-codes" element={<AdminAccessCodes />} />

                        {/* Admin-only routes */}
                        <Route element={<AdminOnlyRoute />}>
                          <Route path="guides" element={<AdminGuides />} />
                          <Route path="guides/new" element={<GuideForm />} />
                          <Route path="guides/edit/:id" element={<GuideForm />} />
                          <Route path="surveys" element={<AdminSurveys />} />
                          <Route path="users" element={<AdminUsers />} />
                        </Route>
                      </Route>
                    </Route>

                    {/* 404 catch-all */}
                    <Route path="*" element={<Layout />}>
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </LanguageProvider>
          </AuthProvider>
        </VisitorProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

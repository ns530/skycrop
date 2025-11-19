import React, { Suspense } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AuthLayout } from '../app/layouts/AuthLayout';
import { DashboardLayout } from '../app/layouts/DashboardLayout';
import { MapFirstLayout } from '../app/layouts/MapFirstLayout';
import { RootLayout } from '../app/layouts/RootLayout';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { RequireRole } from '../features/auth/components/RequireRole';

// Lazy load auth pages
const LoginPage = React.lazy(() => import('../features/auth/pages/LoginPage'));
const RegisterPage = React.lazy(() => import('../features/auth/pages/RegisterPage'));
const ResetPasswordPage = React.lazy(() => import('../features/auth/pages/ResetPasswordPage'));
const OAuthCallbackPage = React.lazy(() => import('../features/auth/pages/OAuthCallbackPage'));

// Lazy load field pages
const DashboardPage = React.lazy(() => import('../features/fields/pages/DashboardPage'));
const FieldsListPage = React.lazy(() => import('../features/fields/pages/FieldsListPage'));
const FieldDetailPage = React.lazy(() => import('../features/fields/pages/FieldDetailPage'));
const CreateFieldPage = React.lazy(() => import('../features/fields/pages/CreateFieldPage'));
const CreateFieldWithMapPage = React.lazy(() => import('../features/fields/pages/CreateFieldWithMapPage'));
const EditFieldBoundaryPage = React.lazy(() => import('../features/fields/pages/EditFieldBoundaryPage'));

// Lazy load feature pages
const FieldHealthPage = React.lazy(() => import('../features/health/pages/FieldHealthPage'));
const FieldRecommendationsPage = React.lazy(() => import('../features/recommendations/pages/FieldRecommendationsPage'));
const FieldWeatherPage = React.lazy(() => import('../features/weather/pages/FieldWeatherPage'));
const WeatherOverviewPage = React.lazy(() => import('../features/weather/pages/WeatherOverviewPage'));

// Lazy load admin pages
const AdminOverviewPage = React.lazy(() => import('../features/admin/pages/AdminOverviewPage'));
const AdminUsersPage = React.lazy(() => import('../features/admin/pages/AdminUsersPage'));
const AdminContentPage = React.lazy(() => import('../features/admin/pages/AdminContentPage'));
const AdminSystemHealthPage = React.lazy(() => import('../features/admin/pages/AdminSystemHealthPage'));

// Lazy load news pages
const NewsListPage = React.lazy(() => import('../features/news/pages/NewsListPage'));
const ArticleDetailPage = React.lazy(() => import('../features/news/pages/ArticleDetailPage'));

// Lazy load settings pages
const NotificationSettingsPage = React.lazy(() => import('../features/settings/pages/NotificationSettingsPage'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'auth',
        element: <AuthLayout />,
        children: [
          {
            path: 'login',
            element: (
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: 'register',
            element: (
              <Suspense fallback={<PageLoader />}>
                <RegisterPage />
              </Suspense>
            ),
          },
          {
            path: 'reset-password',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ResetPasswordPage />
              </Suspense>
            ),
          },
          {
            path: 'callback',
            element: (
              <Suspense fallback={<PageLoader />}>
                <OAuthCallbackPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: (
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        ),
        children: [
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'fields',
            element: (
              <Suspense fallback={<PageLoader />}>
                <FieldsListPage />
              </Suspense>
            ),
          },
          {
            path: 'fields/create',
            element: (
              <Suspense fallback={<PageLoader />}>
                <CreateFieldPage />
              </Suspense>
            ),
          },
          {
            path: 'fields/create-with-map',
            element: (
              <Suspense fallback={<PageLoader />}>
                <CreateFieldWithMapPage />
              </Suspense>
            ),
          },
          {
            path: 'fields/:fieldId',
            element: (
              <Suspense fallback={<PageLoader />}>
                <FieldDetailPage />
              </Suspense>
            ),
          },
          {
            path: 'weather',
            element: (
              <Suspense fallback={<PageLoader />}>
                <WeatherOverviewPage />
              </Suspense>
            ),
          },
          {
            path: 'news',
            element: (
              <Suspense fallback={<PageLoader />}>
                <NewsListPage />
              </Suspense>
            ),
          },
          {
            path: 'news/:id',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ArticleDetailPage />
              </Suspense>
            ),
          },
          {
            path: 'settings/notifications',
            element: (
              <Suspense fallback={<PageLoader />}>
                <NotificationSettingsPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: (
          <RequireAuth>
            <MapFirstLayout />
          </RequireAuth>
        ),
        children: [
          {
            path: 'fields/:fieldId/health',
            element: (
              <Suspense fallback={<PageLoader />}>
                <FieldHealthPage />
              </Suspense>
            ),
          },
          {
            path: 'fields/:fieldId/recommendations',
            element: (
              <Suspense fallback={<PageLoader />}>
                <FieldRecommendationsPage />
              </Suspense>
            ),
          },
          {
            path: 'fields/:fieldId/weather',
            element: (
              <Suspense fallback={<PageLoader />}>
                <FieldWeatherPage />
              </Suspense>
            ),
          },
          {
            path: 'fields/:fieldId/edit-boundary',
            element: (
              <Suspense fallback={<PageLoader />}>
                <EditFieldBoundaryPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: (
          <RequireAuth>
            <RequireRole requiredRole="admin">
              <DashboardLayout />
            </RequireRole>
          </RequireAuth>
        ),
        children: [
          {
            path: 'admin',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminOverviewPage />
              </Suspense>
            ),
          },
          {
            path: 'admin/users',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminUsersPage />
              </Suspense>
            ),
          },
          {
            path: 'admin/content',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminContentPage />
              </Suspense>
            ),
          },
          {
            path: 'admin/system-health',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminSystemHealthPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
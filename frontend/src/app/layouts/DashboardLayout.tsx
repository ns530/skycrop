import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
 
import { useAuth } from '../../features/auth/context/AuthContext';
import { useBreadcrumbs, Breadcrumbs } from '../../shared/hooks/useBreadcrumbs';
import { Button } from '../../shared/ui/Button';
import { PageContainer } from '../../shared/ui/layout/PageContainer';
 
/**
 * DashboardLayout
 *
 * Authenticated shell with sidebar navigation, breadcrumb trail, and main
 * content area. The global header and primary nav live in RootLayout.
 */
export const DashboardLayout: React.FC = () => {
  const breadcrumbs = useBreadcrumbs();
  const { hasRole } = useAuth();
 
  const sidebarLinkBase =
    'flex h-10 items-center rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50';
 
  const sidebarNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      sidebarLinkBase,
      isActive
        ? 'bg-gray-100 text-gray-900 font-semibold'
        : 'text-gray-700 hover:bg-gray-50',
    ].join(' ');
 
  return (
    <div className="min-h-[70vh] bg-gray-100 text-gray-900">
      <PageContainer fullWidth className="flex gap-6 py-4">
        {/* Sidebar */}
        <aside
          className="hidden md:flex w-60 flex-col gap-2 border-r border-gray-100 pr-4 text-sm"
          aria-label="Section navigation"
        >
          <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Workspace
          </span>
          <nav className="flex flex-col gap-1">
            <NavLink to="/dashboard" className={sidebarNavLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/fields" className={sidebarNavLinkClass}>
              Fields
            </NavLink>
            <NavLink to="/weather" className={sidebarNavLinkClass}>
              Weather
            </NavLink>
            <NavLink to="/news" className={sidebarNavLinkClass}>
              News
            </NavLink>
            {hasRole('admin') && (
              <NavLink to="/admin" className={sidebarNavLinkClass}>
                Admin
              </NavLink>
            )}
          </nav>
 
          <span className="mt-4 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Insights
          </span>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              className="flex h-9 items-center rounded-md px-3 text-left text-xs text-gray-500 bg-gray-50/60 cursor-not-allowed"
              aria-disabled="true"
            >
              Health (coming soon)
            </button>
            <button
              type="button"
              className="flex h-9 items-center rounded-md px-3 text-left text-xs text-gray-500 bg-gray-50/60 cursor-not-allowed"
              aria-disabled="true"
            >
              Recommendations (coming soon)
            </button>
          </div>
        </aside>
 
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Breadcrumbs above page title */}
          <div className="mb-3">
            <Breadcrumbs items={breadcrumbs} />
          </div>
 
          <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Farmer workspace
              </p>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">
                Add field
              </Button>
              <Button variant="primary" size="sm">
                New task
              </Button>
            </div>
          </header>
 
          <section
            aria-label="Dashboard content"
            className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <Outlet />
          </section>
        </div>
      </PageContainer>
    </div>
  );
};
 
export default DashboardLayout;
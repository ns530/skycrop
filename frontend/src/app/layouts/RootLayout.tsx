import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../../features/auth/context/AuthContext';
import { NotificationBell, NotificationCenter } from '../../shared/components/NotificationCenter';
import { useOnlineStatus } from '../../shared/hooks/useOnlineStatus';
import { useToast } from '../../shared/hooks/useToast';
import { PageContainer } from '../../shared/ui/layout/PageContainer';
 
export const RootLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = React.useState(false);
  const { isOnline } = useOnlineStatus();
  const { showToast } = useToast();
  const [wasOffline, setWasOffline] = React.useState(false);

  // Close mobile navigation when Escape is pressed to avoid trapping keyboard users
  React.useEffect(() => {
    if (!mobileNavOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  React.useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      return;
    }

    if (wasOffline) {
      showToast({
        variant: 'success',
        title: 'Back online',
        description: 'Your connection has been restored.',
      });
      setWasOffline(false);
    }
  }, [isOnline, wasOffline, showToast]);

  const displayRole = user?.role === 'admin' ? 'Admin' : user?.role === 'farmer' ? 'Farmer' : 'Guest';
 
  const linkBaseClasses =
    'inline-flex items-center px-3 py-2 text-sm rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white';
 
  const makeNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      linkBaseClasses,
      isActive ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-50',
    ].join(' ');
 
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900">
      <header role="banner" className="border-b border-gray-100 bg-white shadow-sm">
        <PageContainer className="py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Brand */}
            <div className="flex items-center gap-2 sm:gap-3">
              <NavLink to="/dashboard" className="flex items-center gap-2 focus-visible:outline-none">
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">
                  SC
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold tracking-tight">SkyCrop</span>
                  <span className="text-[11px] text-gray-500">Paddy intelligence for Sri Lanka</span>
                </div>
              </NavLink>
            </div>
 
            {/* Desktop nav */}
            <nav
              aria-label="Primary"
              className="hidden md:flex items-center gap-1 lg:gap-2 text-sm text-gray-700 flex-1 justify-center"
            >
              <NavLink to="/dashboard" className={makeNavLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/fields" className={makeNavLinkClass}>
                Fields
              </NavLink>
              <NavLink to="/weather" className={makeNavLinkClass}>
                Weather
              </NavLink>
              <NavLink to="/news" className={makeNavLinkClass}>
                News
              </NavLink>
              {hasRole('admin') && (
                <NavLink to="/admin" className={makeNavLinkClass}>
                  Admin
                </NavLink>
              )}
            </nav>
 
            {/* User / mobile controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Notification Bell */}
              {user && (
                <div className="relative">
                  <NotificationBell
                    onClick={() => setNotificationCenterOpen(!notificationCenterOpen)}
                    isOpen={notificationCenterOpen}
                  />
                  <NotificationCenter
                    isOpen={notificationCenterOpen}
                    onClose={() => setNotificationCenterOpen(false)}
                  />
                </div>
              )}

              <div className="hidden sm:flex flex-col items-end text-[11px] text-gray-500">
                <span className="sr-only">Current user role</span>
                <span className="font-medium text-gray-900">{displayRole}</span>
                {user && <span className="text-gray-500">Signed in</span>}
              </div>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileNavOpen(false);
                    logout();
                  }}
                  className="hidden sm:inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  Sign out
                </button>
              )}
 
              {/* Mobile menu toggle */}
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileNavOpen}
                aria-controls="primary-navigation-mobile"
                onClick={() => setMobileNavOpen((open: boolean) => !open)}
              >
                <span className="sr-only">Toggle navigation</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {mobileNavOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
 
          {/* Mobile navigation panel */}
          <nav
            id="primary-navigation-mobile"
            aria-label="Primary"
            className={`md:hidden mt-2 space-y-1 ${mobileNavOpen ? 'block' : 'hidden'}`}
          >
            <NavLink to="/dashboard" className={makeNavLinkClass} onClick={() => setMobileNavOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink to="/fields" className={makeNavLinkClass} onClick={() => setMobileNavOpen(false)}>
              Fields
            </NavLink>
            <NavLink to="/weather" className={makeNavLinkClass} onClick={() => setMobileNavOpen(false)}>
              Weather
            </NavLink>
            <NavLink to="/news" className={makeNavLinkClass} onClick={() => setMobileNavOpen(false)}>
              News
            </NavLink>
            {hasRole('admin') && (
              <NavLink to="/admin" className={makeNavLinkClass} onClick={() => setMobileNavOpen(false)}>
                Admin
              </NavLink>
            )}
            {user && (
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  logout();
                }}
                className="mt-1 inline-flex w-full items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Sign out
              </button>
            )}
          </nav>
        </PageContainer>
      </header>

      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200">
          <PageContainer className="py-2">
            <p
              className="flex items-center gap-2 text-xs text-amber-800"
              role="status"
              aria-live="polite"
            >
              <span
                className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"
                aria-hidden="true"
              />
              you're offline. Data may be outdated. Changes will sync when you're back online.
            </p>
          </PageContainer>
        </div>
      )}
 
      <main id="main-content" role="main" className="flex-1 bg-gray-100">
        <PageContainer fullWidth className="h-full">
          <Outlet />
        </PageContainer>
      </main>
    </div>
  );
};
 
export default RootLayout;

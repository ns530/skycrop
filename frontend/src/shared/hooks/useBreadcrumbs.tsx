import React from 'react';
import { useLocation, Link } from 'react-router-dom';

import { allRoutes, findRouteByPath, AppRouteConfig } from '../../config/routes.config';

export interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrent: boolean;
  route?: AppRouteConfig;
}

/**
 * useBreadcrumbs
 *
 * Minimal, non-final implementation that:
 * - Parses the current location pathname
 * - Maps each accumulated segment to a route config (when available)
 * - Returns a breadcrumb trail suitable for dashboard and admin layouts
 */
export const useBreadcrumbs = (): BreadcrumbItem[] => {
  const location = useLocation();

  return React.useMemo(() => {
    const { pathname } = location;

    // Special-case root and dashboard mapping
    if (pathname === '/' || pathname === '/dashboard') {
      const dashboardRoute = allRoutes.find((r) => r.path === '/dashboard');
      return [
        {
          label: dashboardRoute?.breadcrumbLabel ?? dashboardRoute?.label ?? 'Dashboard',
          path: '/dashboard',
          isCurrent: true,
          route: dashboardRoute,
        },
      ];
    }

    const segments = pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const route = findRouteByPath(currentPath);

      const labelFromRoute = route?.breadcrumbLabel ?? route?.label;
      const labelFallback =
        // Replace dynamic params like :fieldId with generic labels
        segment.startsWith(':') ? segment.slice(1) : segment.charAt(0).toUpperCase() + segment.slice(1);

      const isLast = index === segments.length - 1;

      crumbs.push({
        label: labelFromRoute ?? labelFallback,
        path: currentPath,
        isCurrent: isLast,
        route,
      });
    });

    return crumbs;
  }, [location]);
};

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumbs
 *
 * Simple breadcrumb bar used in dashboard/admin layouts.
 * Focused on structure and accessibility; visual design can be refined later.
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-xs sm:text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-gray-500">
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;

          if (isLast) {
            return (
              <li key={crumb.path} className="flex items-center gap-1 text-gray-900 font-medium">
                {index > 0 && <span aria-hidden="true">/</span>}
                <span aria-current="page">{crumb.label}</span>
              </li>
            );
          }

          return (
            <li key={crumb.path} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden="true">/</span>}
              <Link
                to={crumb.path}
                className="text-gray-500 hover:text-gray-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 rounded-sm px-0.5"
              >
                {crumb.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
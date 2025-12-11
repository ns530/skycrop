export type AppRouteId =
  | "auth.login"
  | "auth.register"
  | "auth.resetPassword"
  | "dashboard"
  | "fields.list"
  | "fields.create"
  | "fields.detail"
  | "fields.health"
  | "fields.recommendations"
  | "fields.weather"
  | "fields.editBoundary"
  | "weather.overview"
  | "admin.overview"
  | "admin.users"
  | "admin.content"
  | "admin.systemHealth";

export type AppRouteRole = "farmer" | "admin";

export interface AppRouteConfig {
  id: AppRouteId;
  path: string;
  label: string;
  /** Whether route requires authentication */
  isProtected?: boolean;
  /** Roles allowed to access this route (for admin-only areas) */
  roles?: AppRouteRole[];
  /** Optional breadcrumb label override (else label used) */
  breadcrumbLabel?: string;
}

interface RouteConfigGroup {
  public: AppRouteConfig[];
  farmer: AppRouteConfig[];
  admin: AppRouteConfig[];
}

export const routesConfig: RouteConfigGroup = {
  public: [
    {
      id: "auth.login",
      path: "/auth/login",
      label: "Login",
      breadcrumbLabel: "Sign in",
    },
    {
      id: "auth.register",
      path: "/auth/register",
      label: "Register",
      breadcrumbLabel: "Create account",
    },
    {
      id: "auth.resetPassword",
      path: "/auth/reset-password",
      label: "Reset password",
    },
  ],
  farmer: [
    {
      id: "dashboard",
      path: "/dashboard",
      label: "Dashboard",
      isProtected: true,
    },
    {
      id: "fields.list",
      path: "/fields",
      label: "Fields",
      isProtected: true,
    },
    {
      id: "fields.create",
      path: "/fields/create",
      label: "Create field",
      isProtected: true,
      breadcrumbLabel: "Add field",
    },
    {
      id: "fields.detail",
      path: "/fields/:fieldId",
      label: "Field details",
      isProtected: true,
    },
    {
      id: "fields.health",
      path: "/fields/:fieldId/health",
      label: "Health",
      breadcrumbLabel: "Field health",
      isProtected: true,
    },
    {
      id: "fields.recommendations",
      path: "/fields/:fieldId/recommendations",
      label: "Recommendations",
      breadcrumbLabel: "Field recommendations",
      isProtected: true,
    },
    {
      id: "fields.weather",
      path: "/fields/:fieldId/weather",
      label: "Weather",
      breadcrumbLabel: "Field weather",
      isProtected: true,
    },
    {
      id: "fields.editBoundary",
      path: "/fields/:fieldId/edit-boundary",
      label: "Edit boundary",
      breadcrumbLabel: "Edit boundary",
      isProtected: true,
    },
    {
      id: "weather.overview",
      path: "/weather",
      label: "Weather",
      isProtected: true,
    },
  ],
  admin: [
    {
      id: "admin.overview",
      path: "/admin",
      label: "Admin",
      breadcrumbLabel: "Admin overview",
      isProtected: true,
      roles: ["admin"],
    },
    {
      id: "admin.users",
      path: "/admin/users",
      label: "Users",
      breadcrumbLabel: "User management",
      isProtected: true,
      roles: ["admin"],
    },
    {
      id: "admin.content",
      path: "/admin/content",
      label: "Content",
      breadcrumbLabel: "Content management",
      isProtected: true,
      roles: ["admin"],
    },
    {
      id: "admin.systemHealth",
      path: "/admin/system-health",
      label: "System health",
      breadcrumbLabel: "System health",
      isProtected: true,
      roles: ["admin"],
    },
  ],
};

export const allRoutes: AppRouteConfig[] = [
  ...routesConfig.public,
  ...routesConfig.farmer,
  ...routesConfig.admin,
];

/**
 * Utility to find a route configuration by its path.
 * This is useful for breadcrumbs and navigation components.
 */
export const findRouteByPath = (
  pathname: string,
): AppRouteConfig | undefined => {
  // Strip trailing slash for comparison consistency
  const normalized = pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
  return allRoutes.find((route) => route.path === normalized);
};

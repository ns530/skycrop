# SkyCrop Frontend Architecture Document

## Introduction

This document captures the current state of the SkyCrop frontend codebase, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on enhancements and bug fixes.

### Document Scope

Focused on the React.js web application frontend, including all identified errors and bugs that need fixing: ESLint issues, TypeScript type errors, React Query v5 migration, and test failures.

### Change Log

| Date   | Version | Description                 | Author    |
| ------ | ------- | --------------------------- | --------- |
| 2025-11-17 | 1.0     | Initial frontend analysis | BMad Master |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: `src/main.tsx` - React 18 root rendering with providers
- **App Component**: `src/app/App.tsx` - Router provider with accessibility skip link
- **Providers**: `src/app/providers/AppProviders.tsx` - React Query, Auth, Theme, UI, Toast providers
- **Router Config**: `src/routes/router.tsx` - Nested routing with auth guards
- **HTTP Client**: `src/shared/api/httpClient.ts` - Axios with auth interceptors and token refresh
- **Query Keys**: `src/shared/query/queryKeys.ts` - Centralized React Query key factories

### Current Issues Impact Areas

- **ESLint Config**: `eslint.config.mjs` - 232 issues, mainly TS project config and parsing errors
- **TypeScript Config**: `tsconfig.json` - 25 type errors, React Query v5 breaking changes
- **Jest Config**: `jest.config.cjs` - 11 failed test suites, missing AuthProvider wrappers
- **Playwright Config**: `playwright.config.ts` - Failed to run due to compilation errors

## High Level Architecture

### Technical Summary

SkyCrop frontend is a React 18 TypeScript application built with Vite, using React Query v5 for data fetching, React Router v6 for routing, Tailwind CSS for styling, and Jest/Playwright for testing. The app follows a feature-based architecture with shared utilities.

### Actual Tech Stack

| Category  | Technology | Version | Purpose | Rationale |
| --------- | ---------- | ------- | ------- | --------- |
| Runtime   | Node.js    | 18+     | JavaScript runtime | Standard for modern React apps |
| Framework | React      | 18.3.1  | UI framework | Latest stable with concurrent features |
| Build Tool| Vite       | 5.4.10  | Development server and bundler | Fast HMR and modern ES modules |
| Language  | TypeScript | 5.6.3   | Type safety | Strict mode enabled for reliability |
| State Management | React Query | 5.59.0 | Server state management | Efficient caching and synchronization |
| Routing   | React Router | 6.28.0 | Client-side routing | Standard React routing library |
| Styling   | Tailwind CSS | 3.4.14 | Utility-first CSS | Consistent design system |
| HTTP Client | Axios | 1.7.0 | API communication | Robust with interceptors |
| Testing Framework | Jest | 29.7.0 | Unit testing | Fast and feature-rich |
| E2E Testing | Playwright | 1.48.0 | End-to-end testing | Cross-browser support |
| Linting | ESLint | 9.0.0 | Code quality | Strict rules with TypeScript support |
| Code Formatting | Prettier | 3.3.3 | Code formatting | Consistent style |

## Source Tree and Module Organization

### Project Structure (Actual)

```
frontend/
├── src/
│   ├── app/                    # Application-level components and providers
│   │   ├── App.tsx            # Main app component with router
│   │   ├── layouts/           # Layout components (Root, Auth, Dashboard, MapFirst)
│   │   └── providers/         # Context providers (AppProviders, ThemeProvider)
│   ├── config/                # Application configuration
│   │   └── routes.config.ts   # Route configuration constants
│   ├── features/              # Feature-based modules
│   │   ├── auth/              # Authentication feature
│   │   │   ├── api/           # Auth API calls
│   │   │   ├── components/    # Auth components (RequireAuth, RequireRole)
│   │   │   ├── context/       # AuthContext
│   │   │   ├── hooks/         # Auth hooks
│   │   │   └── pages/         # Auth pages (Login, Register, etc.)
│   │   ├── fields/            # Fields management feature
│   │   ├── health/            # Field health monitoring
│   │   ├── ml/                # ML service integration
│   │   ├── recommendations/   # AI recommendations
│   │   ├── weather/           # Weather data
│   │   └── admin/             # Admin functionality
│   ├── routes/                # Routing configuration
│   │   └── router.tsx         # React Router setup with nested routes
│   ├── shared/                # Shared utilities and components
│   │   ├── api/               # Shared API utilities (httpClient)
│   │   ├── context/           # Shared contexts (UiContext)
│   │   ├── hooks/             # Shared hooks (useToast, useOnlineStatus)
│   │   ├── query/             # React Query setup (queryKeys)
│   │   ├── types/             # Shared TypeScript types
│   │   └── ui/                # Reusable UI components (Button, Card, Modal, etc.)
│   └── test/                  # Test utilities and mocks
├── e2e/                       # End-to-end tests (Playwright)
├── public/                    # Static assets
├── index.html                 # HTML template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── jest.config.cjs            # Jest configuration
├── playwright.config.ts       # Playwright configuration
├── eslint.config.mjs          # ESLint configuration
├── tailwind.config.cjs        # Tailwind configuration
└── package.json               # Dependencies and scripts
```

### Key Modules and Their Purpose

- **App Module** (`src/app/`): Core application setup, layouts, and providers
- **Auth Feature** (`src/features/auth/`): User authentication and authorization
- **Fields Feature** (`src/features/fields/`): Field management and CRUD operations
- **Health Feature** (`src/features/health/`): Field health monitoring and analytics
- **ML Feature** (`src/features/ml/`): Machine learning service integration
- **Recommendations Feature** (`src/features/recommendations/`): AI-powered recommendations
- **Weather Feature** (`src/features/weather/`): Weather data and forecasting
- **Admin Feature** (`src/features/admin/`): Administrative functions
- **Shared Module** (`src/shared/`): Common utilities, components, and types

## Technical Debt and Known Issues

### Critical Technical Debt

1. **React Query v5 Migration**: Using v5 but not updated for breaking changes (keepPreviousData → placeholderData, cacheTime → gcTime)
2. **ESLint Configuration**: 232 issues, mainly TS project config and parsing errors
3. **TypeScript Type Errors**: 25 type errors due to React Query API changes
4. **Test Suite Failures**: 11 failed test suites missing AuthProvider wrappers
5. **Missing @types/node**: Required for process type but not installed

### Workarounds and Gotchas

- **Query Client Configuration**: No default options set, may cause issues with error handling
- **Auth State Management**: Global auth state in httpClient, not integrated with React Query
- **Theme Provider**: Stub implementation, only supports light mode
- **Test Setup**: Missing AuthProvider in test wrappers causing failures

## Integration Points and External Dependencies

### External Services

| Service  | Purpose  | Integration Type | Key Files |
| -------- | -------- | ---------------- | --------- |
| Backend API | Core business logic | REST API via Axios | `src/shared/api/httpClient.ts` |
| ML Service | AI/ML predictions | REST API via Axios | `src/features/ml/api/mlApi.ts` |
| OAuth Provider | Authentication | Redirect flow | `src/features/auth/pages/OAuthCallbackPage.tsx` |

### Internal Integration Points

- **Backend API**: Proxied through Vite dev server to localhost:4000
- **ML Service**: Proxied through Vite dev server to localhost:8000
- **Authentication**: JWT tokens with refresh logic in httpClient interceptors

## Development and Deployment

### Local Development Setup

```bash
npm install
npm run dev  # Starts Vite dev server on port 5173
```

### Build and Deployment Process

```bash
npm run build  # Production build to dist/
npm run preview  # Preview production build
```

### Testing Commands

```bash
npm run lint       # ESLint check
npm run type-check # TypeScript check
npm test           # Jest unit tests
npm run test:e2e   # Playwright E2E tests
```

## Testing Reality

### Current Test Coverage

- Unit Tests: Jest with React Testing Library, multiple failing suites
- Integration Tests: Limited, focused on API interactions
- E2E Tests: Playwright, blocked by compilation errors
- Component Tests: Some coverage, but missing provider wrappers

### Test Setup Issues

- AuthProvider not wrapped in test components
- React Query client not configured in tests
- MSW (Mock Service Worker) configured but not used consistently

## Component Standards

### Component Template

```typescript
import React from 'react';

interface ComponentNameProps {
  // Define props here
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  // Destructure props
}) => {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

### Naming Conventions

- Components: PascalCase (e.g., `FieldCard.tsx`)
- Files: PascalCase for components, camelCase for utilities
- Hooks: camelCase with `use` prefix (e.g., `useFields.ts`)
- Types: PascalCase with descriptive names

## State Management

### React Query Configuration

- Centralized query keys in `src/shared/query/queryKeys.ts`
- No default QueryClient options configured
- Error handling through httpClient normalization

### Context Providers

- AuthContext: JWT token management
- UiContext: UI state (toasts, modals)
- ThemeContext: Stub for future theming

## API Integration

### HTTP Client Configuration

- Base URL: `/api/v1`
- Auth interceptors for JWT tokens
- Automatic token refresh on 401 responses
- Error normalization to ApiError instances

### Service Pattern

```typescript
import { httpClient } from '../../shared/api/httpClient';

export const apiService = {
  async getData(params: Params): Promise<Data> {
    const response = await httpClient.get('/endpoint', { params });
    return response.data;
  },
};
```

## Routing

### Route Configuration

- Browser router with nested routes
- Auth guards using RequireAuth and RequireRole components
- Layout-based routing (AuthLayout, DashboardLayout, MapFirstLayout)

## Styling Guidelines

### Tailwind CSS Approach

- Utility-first CSS with custom design tokens
- Responsive design with mobile-first approach
- Accessibility considerations built-in

### Global Theme Variables

```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --font-family: 'Inter', sans-serif;
}
```

## Testing Requirements

### Component Test Template

```typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('expected text')).toBeInTheDocument();
  });
});
```

### Testing Best Practices

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions with React Query
- **E2E Tests**: Test critical user flows with Playwright
- **Coverage Goals**: Aim for 80% code coverage
- **Test Structure**: Arrange-Act-Assert pattern
- **Mock External Dependencies**: API calls, routing, state management

## Environment Configuration

Required environment variables (if any) should be documented in `.env.example`

## Frontend Developer Standards

### Critical Coding Rules

1. Use TypeScript strict mode
2. Follow React functional components with hooks
3. Use React Query for server state
4. Implement proper error boundaries
5. Follow accessibility guidelines (WCAG 2.1)
6. Use semantic HTML elements
7. Maintain mobile-first responsive design

### Quick Reference

- **Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Test**: `npm test`
- **Type Check**: `npm run type-check`
- **E2E Test**: `npm run test:e2e`

Common patterns:
- Feature-based folder structure
- Shared utilities in `src/shared/`
- Centralized API calls in feature `api/` folders
- React Query keys in `src/shared/query/queryKeys.ts`
/**
 * FieldMap Component - Platform-specific export
 * 
 * This file re-exports the platform-specific FieldMap component.
 * React Native Metro bundler will automatically resolve to:
 * - FieldMap.native.tsx for iOS/Android
 * - FieldMap.web.tsx for web
 * 
 * For TypeScript, we export from .native.tsx as the default.
 * Metro will handle platform resolution at runtime.
 */

// Re-export from native version for TypeScript
// Metro bundler will automatically resolve to the correct platform file
export { FieldMap } from './FieldMap.native';


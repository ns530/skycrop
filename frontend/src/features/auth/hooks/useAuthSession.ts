import { useAuth, type AuthContextValue } from '../context/AuthContext';

/**
 * useAuthSession
 *
 * Thin alias around useAuth() to make session usage explicit in pages/components.
 * This currently does not call any backend /auth/me endpoint (Option A).
 */
export const useAuthSession = (): AuthContextValue => useAuth();
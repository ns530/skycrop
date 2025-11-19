import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ApiError } from '../../../shared/api/httpClient';
import { useToast } from '../../../shared/hooks/useToast';
import { Card } from '../../../shared/ui/Card';
import { useAuth } from '../context/AuthContext';

const POST_LOGIN_REDIRECT_KEY = 'skycrop_post_login_redirect';

/**
 * OAuthCallbackPage
 *
 * Handles the redirect from the backend Google OAuth callback:
 * - Reads ?token=<jwt> from the URL
 * - Calls completeOAuthLogin(token) to hydrate AuthContext and localStorage
 * - Redirects to the post-login path stored in sessionStorage (if any) or /dashboard
 */
export const OAuthCallbackPage: React.FC = () => {
  const { completeOAuthLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [statusMessage, setStatusMessage] = useState('Signing you in with Google…');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    const run = async () => {
      if (!token) {
        setStatusMessage('Missing token in callback URL.');
        showToast({
          variant: 'error',
          title: 'Google sign-in failed',
          description: 'We could not complete sign-in because the token was missing.',
        });
        navigate('/auth/login', { replace: true });
        return;
      }

      try {
        await completeOAuthLogin(token);

        const redirectTarget =
          window.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY) || '/dashboard';
        window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);

        navigate(redirectTarget, { replace: true });
      } catch (error) {
        const apiError = error as ApiError;
        setStatusMessage('Google sign-in failed.');
        showToast({
          variant: 'error',
          title: 'Google sign-in failed',
          description: apiError?.message || 'Something went wrong while completing sign-in.',
        });
        navigate('/auth/login', { replace: true });
      }
    };

    void run();
  }, [location.search, completeOAuthLogin, navigate, showToast]);

  return (
    <section aria-labelledby="oauth-callback-heading" className="space-y-6">
      <header className="space-y-1">
        <h1 id="oauth-callback-heading" className="text-xl font-semibold text-gray-900">
          Completing sign-in
        </h1>
        <p className="text-sm text-gray-600">{statusMessage}</p>
      </header>

      <Card>
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <svg
            className="h-5 w-5 animate-spin text-brand-blue"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>Please wait while we finish signing you in…</span>
        </div>
      </Card>
    </section>
  );
};

export default OAuthCallbackPage;
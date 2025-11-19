import React, { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { ApiError } from '../../../shared/api/httpClient';
import { useToast } from '../../../shared/hooks/useToast';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { useAuth } from '../context/AuthContext';

/**
 * LoginPage
 *
 * Email/password login with basic validation, error handling, and
 * Google OAuth entrypoint wiring. Successful sign-in redirects to:
 * - the original protected route (if RequireAuth set `location.state.from`), or
 * - /dashboard by default.
 */
export const LoginPage: React.FC = () => {
  const { loginWithEmail, startGoogleOAuth } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } } & Location;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTarget = location.state?.from || '/dashboard';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      showToast({
        variant: 'error',
        title: 'Missing details',
        description: 'Please enter both your email and password.',
      });
      return;
    }

    if (!email.includes('@')) {
      showToast({
        variant: 'error',
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithEmail({ email: email.trim(), password });

      // In a future iteration, rememberMe can control persistence strategy.
      void rememberMe;

      navigate(redirectTarget, { replace: true });
    } catch (error) {
      const apiError = error as ApiError;
      showToast({
        variant: 'error',
        title: 'Sign in failed',
        description: apiError?.message || 'Unable to sign you in right now.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = () => {
    startGoogleOAuth(redirectTarget);
  };

  return (
    <section aria-labelledby="login-heading" className="space-y-6">
      <header className="space-y-1">
        <h1 id="login-heading" className="text-xl font-semibold text-gray-900">
          Sign in
        </h1>
        <p className="text-sm text-gray-600">
          Access your SkyCrop dashboard to monitor fields, health, and recommendations.
        </p>
      </header>

      <Card>
        <form className="space-y-4" aria-label="Login form" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-1"
              placeholder="farmer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-1"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="inline-flex items-center gap-2">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-1"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-gray-700">Remember me</span>
            </label>
            <Link
              to="/auth/reset-password"
              className="text-brand-blue hover:text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 rounded-sm px-0.5"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="mt-2 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Continue'}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-400">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full"
            onClick={handleGoogleClick}
          >
            Continue with Google
          </Button>
        </form>
      </Card>

      <p className="text-xs text-gray-600">
        New to SkyCrop?{' '}
        <Link
          to="/auth/register"
          className="font-medium text-brand-blue hover:text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 rounded-sm px-0.5"
        >
          Create an account
        </Link>
      </p>
    </section>
  );
};

export default LoginPage;
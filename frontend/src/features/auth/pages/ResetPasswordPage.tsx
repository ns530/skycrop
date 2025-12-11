import React, { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { ApiError } from "../../../shared/api/httpClient";
import { useToast } from "../../../shared/hooks/useToast";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { useAuth } from "../context/AuthContext";

/**
 * ResetPasswordPage
 *
 * Dual-purpose page:
 * - Without a `token` query param: lets the user request a password reset email.
 * - With a `token` query param: lets the user choose a new password using that token.
 */
export const ResetPasswordPage: React.FC = () => {
  const { requestPasswordReset, resetPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");
  const hasToken = Boolean(token);

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      showToast({
        variant: "error",
        title: "Missing email",
        description: "Please enter the email associated with your account.",
      });
      return;
    }

    if (!email.includes("@")) {
      showToast({
        variant: "error",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      showToast({
        variant: "success",
        title: "Check your inbox",
        description:
          "If an account exists for this email, a reset link has been sent.",
      });
    } catch (error) {
      const apiError = error as ApiError;
      showToast({
        variant: "error",
        title: "Could not send reset link",
        description:
          apiError?.message ||
          "Something went wrong while sending the reset link.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token) {
      showToast({
        variant: "error",
        title: "Missing reset token",
        description: "The reset link is invalid or incomplete.",
      });
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      showToast({
        variant: "error",
        title: "Missing password",
        description: "Please enter and confirm your new password.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast({
        variant: "error",
        title: "Passwords do not match",
        description: "Please make sure both password fields match.",
      });
      return;
    }

    if (newPassword.length < 8) {
      showToast({
        variant: "error",
        title: "Weak password",
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      navigate("/auth/login", { replace: true });
    } catch (error) {
      const apiError = error as ApiError;
      showToast({
        variant: "error",
        title: "Could not reset password",
        description:
          apiError?.message ||
          "Something went wrong while updating your password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="reset-password-heading" className="space-y-6">
      <header className="space-y-1">
        <h1
          id="reset-password-heading"
          className="text-xl font-semibold text-gray-900"
        >
          {hasToken ? "Choose a new password" : "Reset your password"}
        </h1>
        <p className="text-sm text-gray-600">
          {hasToken
            ? "Enter and confirm your new password below."
            : "Enter the email associated with your account and we'll send a reset link."}
        </p>
      </header>

      <Card>
        {hasToken ? (
          <form
            className="space-y-4"
            aria-label="Set new password form"
            onSubmit={handleResetSubmit}
            noValidate
          >
            <div className="space-y-1">
              <label
                htmlFor="new-password"
                className="block text-xs font-medium text-gray-700"
              >
                New password
              </label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-1"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="confirm-password"
                className="block text-xs font-medium text-gray-700"
              >
                Confirm new password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-1"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="mt-2 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating password…" : "Update password"}
            </Button>
          </form>
        ) : (
          <form
            className="space-y-4"
            aria-label="Reset password form"
            onSubmit={handleRequestSubmit}
            noValidate
          >
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-700"
              >
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

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="mt-2 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending reset link…" : "Send reset link"}
            </Button>
          </form>
        )}
      </Card>

      <p className="text-xs text-gray-600">
        Remembered your password?{" "}
        <Link
          to="/auth/login"
          className="font-medium text-brand-blue hover:text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 rounded-sm px-0.5"
        >
          Return to sign in
        </Link>
      </p>
    </section>
  );
};

export default ResetPasswordPage;

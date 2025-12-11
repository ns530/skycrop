import React, { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApiError } from "../../../shared/api/httpClient";
import { useToast } from "../../../shared/hooks/useToast";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { useAuth } from "../context/AuthContext";

/**
 * RegisterPage
 *
 * Email/password registration wired to backend auth APIs.
 * On success:
 * - user is authenticated and stored in AuthContext + localStorage
 * - a success toast is shown (from AuthContext)
 * - navigation goes to /dashboard
 */
export const RegisterPage: React.FC = () => {
  const { registerWithEmail } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      showToast({
        variant: "error",
        title: "Missing details",
        description: "Please fill in your name, email, and password.",
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

    if (password.length < 8) {
      showToast({
        variant: "error",
        title: "Weak password",
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await registerWithEmail({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate("/dashboard", { replace: true });
    } catch (error) {
      const apiError = error as ApiError;
      showToast({
        variant: "error",
        title: "Could not create account",
        description:
          apiError?.message ||
          "Something went wrong while creating your account.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="register-heading" className="space-y-6">
      <header className="space-y-1">
        <h1
          id="register-heading"
          className="text-xl font-semibold text-gray-900"
        >
          Create an account
        </h1>
        <p className="text-sm text-gray-600">
          Set up your SkyCrop workspace to start monitoring your fields and crop
          health.
        </p>
      </header>

      <Card>
        <form
          className="space-y-4"
          aria-label="Registration form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="space-y-1">
            <label
              htmlFor="name"
              className="block text-xs font-medium text-gray-700"
            >
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-1"
              placeholder="A. Farmer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-1"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="mt-1 text-[11px] text-gray-500">
              At least 8 characters, including uppercase, lowercase, and a
              number.
            </p>
          </div>

          {/* Role selector left as non-functional placeholder; backend assigns role=farmer for signup */}
          <div className="space-y-1">
            <label
              htmlFor="role"
              className="block text-xs font-medium text-gray-700"
            >
              Role (placeholder)
            </label>
            <select
              id="role"
              name="role"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-1"
              defaultValue="farmer"
              aria-disabled="true"
            >
              <option value="farmer">Farmer</option>
              <option value="admin" disabled>
                Admin (assigned by system)
              </option>
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="mt-2 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Card>

      <p className="text-xs text-gray-600">
        Already have an account?{" "}
        <Link
          to="/auth/login"
          className="font-medium text-brand-blue hover:text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 rounded-sm px-0.5"
        >
          Sign in
        </Link>
      </p>
    </section>
  );
};

export default RegisterPage;

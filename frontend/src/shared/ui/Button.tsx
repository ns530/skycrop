import clsx from "clsx";
import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";
type ButtonAs = "button" | "a";

/**
 * Shared button props
 *
 * Default rendering is a native <button>. For rare navigation-style actions,
 * `as="a"` can be used to render an <a> element while preserving button-like
 * keyboard behavior.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  as?: ButtonAs;
  /**
   * Optional href/target/rel are used when `as="a"`.
   */
  href?: string;
  target?: string;
  rel?: string;
}

/**
 * Button
 *
 * Minimal design-system button wired to SkyCrop brand and semantic colors.
 * - Ensures at least 44px hit target for accessibility for md and lg sizes.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  as = "button",
  href,
  target,
  rel,
  className,
  children,
  ...rest
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors";

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "text-xs px-3 h-9",
    md: "text-sm px-4 h-11",
    lg: "text-base px-5 h-12",
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-brand-blue text-white hover:bg-blue-600",
    secondary: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-900 hover:bg-gray-100",
    destructive: "bg-status-poor text-white hover:bg-red-600",
  };

  const widthClasses = fullWidth ? "w-full" : "";

  const { type: buttonType, ...restProps } = rest;

  const commonClassName = clsx(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    widthClasses,
    className,
  );

  if (as === "a") {
    const anchorProps =
      restProps as React.AnchorHTMLAttributes<HTMLAnchorElement>;

    return (
      <a
        href={href}
        target={target}
        rel={rel}
        // When rendered as a link-but-behaving-like-a-button, ensure keyboard access
        role={anchorProps.role ?? "button"}
        tabIndex={anchorProps.tabIndex ?? 0}
        className={commonClassName}
        {...anchorProps}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={buttonType ?? "button"}
      className={commonClassName}
      {...(restProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
};

export default Button;

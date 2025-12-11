import clsx from "clsx";
import React from "react";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * If true, uses a full-width layout instead of the default max-width container.
   */
  fullWidth?: boolean;
}

/**
 * PageContainer
 *
 * Provides a consistent max-width (approximately 1200px) container with
 * horizontal padding and vertical spacing, matching the SkyCrop design system.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  fullWidth,
  className,
  children,
  ...rest
}) => {
  const baseClasses = "w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6";
  const widthClasses = fullWidth ? "mx-auto" : "mx-auto max-w-page";

  return (
    <div className={clsx(baseClasses, widthClasses, className)} {...rest}>
      {children}
    </div>
  );
};

export default PageContainer;

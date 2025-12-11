import clsx from "clsx";
import React from "react";

type CardStatus = "default" | "excellent" | "fair" | "poor";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  status?: CardStatus;
  /**
   * Optional subtle status stripe rendered on the left edge of the card.
   */
  showStatusStripe?: boolean;
}

/**
 * Card
 *
 * Basic panel component used for metric cards, forms, and content sections.
 * - Provides padding, background, and border.
 * - Optionally renders a semantic status stripe using health colors.
 */
export const Card: React.FC<CardProps> = ({
  title,
  status = "default",
  showStatusStripe = false,
  className,
  children,
  ...rest
}) => {
  const statusColor =
    status === "excellent"
      ? "bg-status-excellent"
      : status === "fair"
        ? "bg-status-fair"
        : status === "poor"
          ? "bg-status-poor"
          : "bg-transparent";

  return (
    <section
      className={clsx(
        "relative flex rounded-lg border border-gray-100 bg-white shadow-sm",
        "focus-within:ring-2 focus-within:ring-brand-blue focus-within:ring-offset-2",
        className,
      )}
      {...rest}
    >
      {showStatusStripe && status !== "default" && (
        <div
          className={clsx("w-1 rounded-l-lg", statusColor)}
          aria-hidden="true"
        />
      )}
      <div
        className={clsx(
          "flex-1 p-4 sm:p-5",
          showStatusStripe && status !== "default" && "ml-0",
        )}
      >
        {title && (
          <h2
            className="text-sm font-semibold text-gray-900 mb-2"
            aria-label={title}
          >
            {title}
          </h2>
        )}
        <div className="text-sm text-gray-700">{children}</div>
      </div>
    </section>
  );
};

export default Card;

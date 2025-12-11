/**
 * NewsCard Component
 * Card display for news article preview in list
 */

import React from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "../../../shared/ui/Card";
import type { NewsArticle } from "../api/newsApi";

interface NewsCardProps {
  article: NewsArticle;
  onPrefetch?: () => void;
}

/**
 * Get category display info
 */
const getCategoryInfo = (category?: string) => {
  const categoryMap: Record<
    string,
    { label: string; color: string; icon: string }
  > = {
    "farming-tips": {
      label: "Farming Tips",
      color: "bg-green-100 text-green-800",
      icon: "🌾",
    },
    weather: {
      label: "Weather",
      color: "bg-blue-100 text-blue-800",
      icon: "🌤️",
    },
    "market-prices": {
      label: "Market Prices",
      color: "bg-yellow-100 text-yellow-800",
      icon: "💰",
    },
    "government-schemes": {
      label: "Gov Schemes",
      color: "bg-purple-100 text-purple-800",
      icon: "🏛️",
    },
    general: {
      label: "General",
      color: "bg-gray-100 text-gray-800",
      icon: "📰",
    },
  };

  return categoryMap[category || "general"] || categoryMap.general;
};

/**
 * Format relative time (e.g., "2 days ago")
 */
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * NewsCard
 *
 * Displays article preview with:
 * - Title and summary
 * - Category badge
 * - Published date
 * - Optional image
 * - View count
 * - Click to navigate
 *
 * @example
 * ```tsx
 * <NewsCard
 *   article={article}
 *   onPrefetch={() => prefetch(article.id)}
 * />
 * ```
 */
export const NewsCard: React.FC<NewsCardProps> = ({ article, onPrefetch }) => {
  const navigate = useNavigate();
  const categoryInfo = getCategoryInfo(article.category);

  const handleClick = () => {
    navigate(`/news/${article.id}`);
  };

  const handleMouseEnter = () => {
    // Prefetch article data on hover for instant navigation
    if (onPrefetch) {
      onPrefetch();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <div className="flex flex-col gap-3">
          {/* Image (if available) */}
          {article.imageUrl && (
            <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}
            >
              <span>{categoryInfo.icon}</span>
              <span>{categoryInfo.label}</span>
            </span>

            <span className="text-xs text-gray-500 shrink-0">
              {getRelativeTime(article.publishedAt)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 hover:text-brand-blue transition-colors">
            {article.title}
          </h3>

          {/* Summary */}
          <p className="text-sm text-gray-600 line-clamp-3">
            {article.summary}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            {/* Author */}
            {article.author && (
              <span className="text-xs text-gray-500">By {article.author}</span>
            )}

            {/* View count */}
            {article.viewCount !== undefined && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <span>👁️</span>
                <span>{article.viewCount.toLocaleString()} views</span>
              </span>
            )}

            {/* Read more link */}
            <span className="text-xs font-medium text-brand-blue hover:underline">
              Read more →
            </span>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  #{tag}
                </span>
              ))}
              {article.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-gray-500">
                  +{article.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NewsCard;

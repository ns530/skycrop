/**
 * NewsListPage
 * Main page for browsing news/knowledge articles
 */

import React, { useState } from "react";

import { useOnlineStatus } from "../../../shared/hooks/useOnlineStatus";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { ErrorState } from "../../../shared/ui/ErrorState";
import { LoadingState } from "../../../shared/ui/LoadingState";
import type { NewsCategory } from "../api/newsApi";
import { NewsCard } from "../components/NewsCard";
import { useNewsList, usePrefetchNewsArticle } from "../hooks/useNews";

const CATEGORIES: Array<{
  value: NewsCategory | "all";
  label: string;
  icon: string;
}> = [
  { value: "all", label: "All", icon: "📰" },
  { value: "farming-tips", label: "Farming Tips", icon: "🌾" },
  { value: "weather", label: "Weather", icon: "🌤️" },
  { value: "market-prices", label: "Market Prices", icon: "💰" },
  { value: "government-schemes", label: "Gov Schemes", icon: "🏛️" },
];

/**
 * NewsListPage
 *
 * Browse and search knowledge hub articles
 * Features:
 * - Category filtering
 * - Search by keyword
 * - Pagination
 * - Prefetch on hover
 * - Offline support
 *
 * @example
 * Route: /news
 */
export const NewsListPage: React.FC = () => {
  const { isOnline } = useOnlineStatus();
  const [selectedCategory, setSelectedCategory] = useState<
    NewsCategory | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const prefetchArticle = usePrefetchNewsArticle();

  // Fetch news list
  const {
    data: newsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useNewsList({
    page: currentPage,
    pageSize: 12,
    category: selectedCategory === "all" ? undefined : selectedCategory,
    search: searchQuery || undefined,
  });

  const articles = newsData?.data || [];
  const pagination = newsData?.pagination;

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on search
  };

  const handleCategoryChange = (category: NewsCategory | "all") => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section aria-labelledby="news-heading" className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 id="news-heading" className="text-2xl font-bold text-gray-900">
          📰 Knowledge Hub
        </h1>
        <p className="text-sm text-gray-600">
          Stay updated with farming tips, weather updates, market prices, and
          government schemes
        </p>
        {!isOnline && (
          <p className="flex items-center gap-2 text-xs text-amber-700">
            <span
              className="inline-block h-2 w-2 rounded-full bg-amber-500"
              aria-hidden="true"
            />
            {articles.length > 0
              ? "You are offline. Showing cached articles."
              : "You are offline and have no cached articles yet."}
          </p>
        )}
      </header>

      {/* Search Bar */}
      <Card>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
          <Button type="submit" size="md">
            Search
          </Button>
        </form>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryChange(cat.value)}
            className={`
              inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${
                selectedCategory === cat.value
                  ? "bg-brand-blue text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Results Count */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>
            Showing {articles.length} of {pagination.total} articles
            {searchQuery && ` for "${searchQuery}"`}
          </p>
          {isFetching && <span className="text-xs">Refreshing...</span>}
        </div>
      )}

      {/* Loading State */}
      {isLoading && !articles.length && (
        <LoadingState message="Loading articles..." />
      )}

      {/* Error State */}
      {isError && !articles.length && (
        <ErrorState
          title="Unable to load articles"
          message={
            error?.message ?? "Something went wrong while loading articles."
          }
          onRetry={refetch}
        />
      )}

      {/* Empty State */}
      {!isLoading && !isError && articles.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{searchQuery ? "🔍" : "📰"}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No articles found" : "No articles available"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchQuery
                ? `No articles match your search "${searchQuery}". Try different keywords.`
                : "Check back later for new articles and updates."}
            </p>
            {searchQuery && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
              >
                Clear Search
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Articles Grid */}
      {articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              onPrefetch={() => prefetchArticle(article.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > pagination.pageSize && (
        <Card>
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isFetching}
            >
              ← Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from(
                { length: Math.ceil(pagination.total / pagination.pageSize) },
                (_, i) => i + 1,
              )
                .filter((page) => {
                  // Show first, last, current, and adjacent pages
                  return (
                    page === 1 ||
                    page ===
                      Math.ceil(pagination.total / pagination.pageSize) ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {/* Show ellipsis if there's a gap */}
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="text-gray-400">...</span>
                    )}

                    <button
                      onClick={() => handlePageChange(page)}
                      disabled={isFetching}
                      className={`
                        w-8 h-8 rounded text-sm font-medium transition-colors
                        ${
                          currentPage === page
                            ? "bg-brand-blue text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                        }
                      `}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={
                currentPage >=
                  Math.ceil(pagination.total / pagination.pageSize) ||
                isFetching
              }
            >
              Next →
            </Button>
          </div>
        </Card>
      )}
    </section>
  );
};

export default NewsListPage;

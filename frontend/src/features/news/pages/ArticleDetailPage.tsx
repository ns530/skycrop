/**
 * ArticleDetailPage
 * Full article view with rich content
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { ErrorState } from '../../../shared/ui/ErrorState';
import { LoadingState } from '../../../shared/ui/LoadingState';
import { useNewsArticle } from '../hooks/useNews';
import type { NewsCategory } from '../api/newsApi';

/**
 * Get category display info
 */
const getCategoryInfo = (category?: string) => {
  const categoryMap: Record<string, { label: string; color: string; icon: string }> = {
    'farming-tips': { label: 'Farming Tips', color: 'bg-green-100 text-green-800', icon: '🌾' },
    'weather': { label: 'Weather', color: 'bg-blue-100 text-blue-800', icon: '🌤️' },
    'market-prices': { label: 'Market Prices', color: 'bg-yellow-100 text-yellow-800', icon: '💰' },
    'government-schemes': { label: 'Gov Schemes', color: 'bg-purple-100 text-purple-800', icon: '🏛️' },
    'general': { label: 'General', color: 'bg-gray-100 text-gray-800', icon: '📰' },
  };

  return categoryMap[category || 'general'] || categoryMap.general;
};

/**
 * Format full date
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * ArticleDetailPage
 * 
 * Full article view with:
 * - Hero image
 * - Rich text content
 * - Category and tags
 * - Author and date
 * - Back navigation
 * - Share options (future)
 * 
 * @example
 * Route: /news/:id
 */
export const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: article,
    isLoading,
    isError,
    error,
    refetch,
  } = useNewsArticle(id || '');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  if (!id) {
    return (
      <ErrorState
        title="Article not found"
        message="No article ID provided."
        onRetry={() => navigate('/news')}
      />
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading article..." />;
  }

  if (isError || !article) {
    return (
      <ErrorState
        title="Unable to load article"
        message={error?.message ?? 'Something went wrong while loading this article.'}
        onRetry={refetch}
      />
    );
  }

  const categoryInfo = getCategoryInfo(article.category);

  return (
    <article className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/news')}
        >
          ← Back to Articles
        </Button>
      </div>

      {/* Article Header */}
      <Card>
        <div className="space-y-4">
          {/* Category Badge */}
          <div>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${categoryInfo.color}`}
            >
              <span>{categoryInfo.icon}</span>
              <span>{categoryInfo.label}</span>
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {article.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {article.author && (
              <div className="flex items-center gap-2">
                <span className="font-medium">By {article.author}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{formatDate(article.publishedAt)}</span>
            </div>

            {article.viewCount !== undefined && (
              <div className="flex items-center gap-2">
                <span>👁️</span>
                <span>{article.viewCount.toLocaleString()} views</span>
              </div>
            )}
          </div>

          {/* Summary */}
          <p className="text-lg text-gray-700 leading-relaxed">
            {article.summary}
          </p>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Hero Image */}
      {article.imageUrl && (
        <div className="w-full rounded-lg overflow-hidden bg-gray-100 shadow-md">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-auto max-h-[500px] object-cover"
          />
        </div>
      )}

      {/* Article Content */}
      <Card>
        <div
          className="prose prose-sm md:prose-base max-w-none"
          dangerouslySetInnerHTML={{ __html: formatArticleBody(article.body) }}
        />
      </Card>

      {/* Share Section (Future Enhancement) */}
      <Card title="Share this article">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">
            Found this helpful? Share with fellow farmers!
          </p>
          <div className="flex gap-2">
            {/* Placeholder for share buttons */}
            <Button variant="secondary" size="sm" disabled>
              Share
            </Button>
          </div>
        </div>
      </Card>

      {/* Related Articles (Future Enhancement) */}
      <Card title="Related Articles">
        <p className="text-sm text-gray-600">
          More articles coming soon...
        </p>
      </Card>

      {/* Back Button (Bottom) */}
      <div className="flex justify-center">
        <Button
          variant="secondary"
          size="md"
          onClick={() => navigate('/news')}
        >
          ← Back to All Articles
        </Button>
      </div>
    </article>
  );
};

/**
 * Format article body HTML
 * Converts plain text to HTML with basic formatting
 */
const formatArticleBody = (body: string): string => {
  // If body already contains HTML tags, return as-is
  if (/<\/?[a-z][\s\S]*>/i.test(body)) {
    return body;
  }

  // Otherwise, convert plain text to formatted HTML
  return body
    .split('\n\n') // Split into paragraphs
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return '';

      // Check if it's a heading (starts with #)
      if (trimmed.startsWith('# ')) {
        return `<h2 class="text-2xl font-bold mt-6 mb-3">${trimmed.substring(2)}</h2>`;
      }
      if (trimmed.startsWith('## ')) {
        return `<h3 class="text-xl font-semibold mt-4 mb-2">${trimmed.substring(3)}</h3>`;
      }

      // Check if it's a list item
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = paragraph
          .split('\n')
          .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('*'))
          .map((line) => {
            const text = line.trim().substring(2);
            return `<li class="ml-4">${text}</li>`;
          })
          .join('\n');
        return `<ul class="list-disc my-3">${items}</ul>`;
      }

      // Regular paragraph
      return `<p class="mb-4 leading-relaxed">${trimmed}</p>`;
    })
    .join('\n');
};

export default ArticleDetailPage;


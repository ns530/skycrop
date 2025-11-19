import React, { useMemo, useState } from 'react';

import { useToast } from '../../../shared/hooks/useToast';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Modal } from '../../../shared/ui/Modal';
import type { AdminContentItem, AdminContentStatus } from '../api/adminApi';
import { useAdminContent, useUpsertAdminContent } from '../hooks/useAdmin';

/**
 * AdminContentPage
 *
 * Content administration for /admin/content.
 * - Lists news/articles via admin API
 * - Allows editing/creating content items in a simple modal editor
 * - Supports publish/unpublish via status toggle
 */
type EditorState = {
  id?: string;
  title: string;
  summary: string;
  body: string;
  status: AdminContentStatus;
};

const toEditorState = (item?: AdminContentItem | null): EditorState => {
  if (!item) {
    return {
      id: undefined,
      title: '',
      summary: '',
      body: '',
      status: 'draft',
    };
  }

  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    body: item.body,
    status: item.status,
  };
};

export const AdminContentPage: React.FC = () => {
  const { showToast } = useToast();

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminContent({
    page: 1,
    pageSize: 50,
  });

  const items = data?.data ?? [];
  const totalCount = data?.pagination.total ?? 0;

  const { mutateAsync: upsertContent, isLoading: isSaving } = useUpsertAdminContent();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>(() => toEditorState());

  const [publishTarget, setPublishTarget] = useState<AdminContentItem | null>(null);

  const openNewContent = () => {
    setEditor(toEditorState());
    setEditorOpen(true);
  };

  const openEditContent = (item: AdminContentItem) => {
    setEditor(toEditorState(item));
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (isSaving) return;
    setEditorOpen(false);
  };

  const handleChangeField =
    (field: keyof EditorState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setEditor((prev: EditorState) => ({
        ...prev,
        [field]: field === 'status' ? (value as AdminContentStatus) : value,
      }));
    };

  const handleSave = async () => {
    const trimmedTitle = editor.title.trim();
    const trimmedSummary = editor.summary.trim();
    const trimmedBody = editor.body.trim();

    if (!trimmedTitle || !trimmedSummary) {
      showToast({
        title: 'Missing required fields',
        description: 'Title and summary are required to save content.',
        variant: 'warning',
      });
      return;
    }

    try {
      await upsertContent({
        id: editor.id,
        title: trimmedTitle,
        summary: trimmedSummary,
        body: trimmedBody,
        status: editor.status,
      });

      showToast({
        title: editor.id ? 'Content updated' : 'Content created',
        variant: 'success',
      });

      setEditorOpen(false);
    } catch (err) {
      const apiError = err as Error;
      showToast({
        title: 'Failed to save content',
        description: apiError?.message ?? 'Something went wrong while saving content.',
        variant: 'error',
      });
    }
  };

  const handleRetry = async () => {
    try {
      await refetch();
    } catch (err) {
      const apiError = error ?? (err as Error);
      showToast({
        title: 'Failed to load content',
        description: apiError?.message ?? 'Something went wrong while fetching content.',
        variant: 'error',
      });
    }
  };

  const openPublishToggle = (item: AdminContentItem) => {
    setPublishTarget(item);
  };

  const closePublishToggle = () => {
    setPublishTarget(null);
  };

  const handleConfirmPublishToggle = async () => {
    if (!publishTarget) return;

    const nextStatus: AdminContentStatus = publishTarget.status === 'published' ? 'draft' : 'published';

    try {
      await upsertContent({
        id: publishTarget.id,
        status: nextStatus,
      });

      showToast({
        title: nextStatus === 'published' ? 'Content published' : 'Content unpublished',
        variant: 'success',
      });

      closePublishToggle();
    } catch (err) {
      const apiError = err as Error;
      showToast({
        title: 'Failed to update content status',
        description: apiError?.message ?? 'Something went wrong while updating content.',
        variant: 'error',
      });
    }
  };

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aDate = a.publishedAt ?? '';
        const bDate = b.publishedAt ?? '';
        return bDate.localeCompare(aDate);
      }),
    [items],
  );

  const renderStatusBadge = (status: AdminContentStatus) => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center rounded-full bg-status-excellent/10 px-2 py-0.5 text-xs font-medium text-status-excellent">
          Published
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
        Draft
      </span>
    );
  };

  const formatPublishedDate = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  return (
    <section aria-labelledby="admin-content-heading" className="space-y-4">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="admin-content-heading" className="text-lg font-semibold text-gray-900">
            Content management
          </h1>
          <p className="text-sm text-gray-600">Manage news and articles shown to farmers.</p>
        </div>
        <Button size="sm" variant="primary" onClick={openNewContent}>
          New content
        </Button>
      </header>

      <Card>
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-3 text-xs text-gray-600">
          <span>{isFetching ? 'Refreshing content…' : `Total items: ${totalCount}`}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Title
                </th>
                <th scope="col" className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Summary
                </th>
                <th scope="col" className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th scope="col" className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Published
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading content…
                  </td>
                </tr>
              )}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-red-600">
                    <div className="flex flex-col items-center gap-3">
                      <p>Unable to load content.</p>
                      <Button size="sm" variant="secondary" onClick={handleRetry}>
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && sortedItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    No content items yet. Use New content to create the first announcement.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                sortedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 text-gray-900 align-top">
                    <td className="px-4 py-3 text-sm font-medium">{item.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 max-w-md">
                      <span className="line-clamp-2">{item.summary}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{renderStatusBadge(item.status)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatPublishedDate(item.publishedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEditContent(item)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openPublishToggle(item)}
                        >
                          {item.status === 'published' ? 'Unpublish' : 'Publish'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={editorOpen} onClose={closeEditor} title={editor.id ? 'Edit content' : 'New content'}>
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="content-title" className="block text-xs font-medium text-gray-700">
              Title
            </label>
            <input
              id="content-title"
              type="text"
              value={editor.title}
              onChange={handleChangeField('title')}
              className="block w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="Enter a clear headline"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="content-summary" className="block text-xs font-medium text-gray-700">
              Summary
            </label>
            <input
              id="content-summary"
              type="text"
              value={editor.summary}
              onChange={handleChangeField('summary')}
              className="block w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="Short description shown in lists"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="content-body" className="block text-xs font-medium text-gray-700">
              Body
            </label>
            <textarea
              id="content-body"
              value={editor.body}
              onChange={handleChangeField('body')}
              rows={6}
              className="block w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="Full text (supports simple paragraphs; rich formatting to be added later)"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="content-status" className="block text-xs font-medium text-gray-700">
              Status
            </label>
            <select
              id="content-status"
              value={editor.status}
              onChange={handleChangeField('status')}
              className="block w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="secondary" onClick={closeEditor} disabled={isSaving}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!publishTarget}
        onClose={closePublishToggle}
        title={publishTarget?.status === 'published' ? 'Unpublish content' : 'Publish content'}
      >
        {publishTarget && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              You are about to {publishTarget.status === 'published' ? 'unpublish' : 'publish'}{' '}
              <span className="font-medium">{publishTarget.title}</span>.
            </p>
            <p className="text-xs text-gray-500">
              Published items may be visible to farmers in the mobile or web app, depending on configuration.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={closePublishToggle} disabled={isSaving}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleConfirmPublishToggle} disabled={isSaving}>
                {isSaving ? 'Updating…' : 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};

export default AdminContentPage;

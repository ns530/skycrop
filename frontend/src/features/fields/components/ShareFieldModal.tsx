import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError, isAxiosError } from "axios";
import { X, Share2, Send } from "lucide-react";
import React, { useState } from "react";

import { httpClient } from "../../../shared/api/httpClient";
import type { ApiErrorPayload } from "../../../shared/api/httpClient";
import { useToast } from "../../../shared/hooks/useToast";

interface ShareFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldId: string;
  fieldName: string;
}

/**
 * Share Field Modal
 * Allow field owners to share their field with other users
 */
export const ShareFieldModal: React.FC<ShareFieldModalProps> = ({
  isOpen,
  onClose,
  fieldId,
  fieldName,
}) => {
  const [email, setEmail] = useState("");
  const [permissionLevel, setPermissionLevel] = useState<"view" | "edit">(
    "view",
  );
  const [expiresAt, setExpiresAt] = useState("");

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Share field mutation
  const shareMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      permissionLevel: string;
      expiresAt?: string;
    }) => {
      const response = await httpClient.post(`/fields/${fieldId}/share`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fields", fieldId, "shares"],
      });
      showToast({
        variant: "success",
        title: "Field Shared",
        description: `${fieldName} has been shared with ${email}`,
      });
      handleClose();
    },
    onError: (error: unknown) => {
      let errorMessage = "Failed to share field";
      if (isAxiosError<ApiErrorPayload>(error)) {
        const axiosError = error as AxiosError<ApiErrorPayload>;
        errorMessage =
          axiosError.response?.data?.error?.message ||
          axiosError.message ||
          errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      showToast({
        variant: "error",
        title: "Share Failed",
        description: errorMessage,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast({
        variant: "error",
        title: "Validation Error",
        description: "Email is required",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast({
        variant: "error",
        title: "Validation Error",
        description: "Please enter a valid email address",
      });
      return;
    }

    const shareData: {
      email: string;
      permissionLevel: string;
      expiresAt?: string;
    } = { email, permissionLevel };
    if (expiresAt) {
      shareData.expiresAt = expiresAt;
    }

    shareMutation.mutate(shareData);
  };

  const handleClose = () => {
    setEmail("");
    setPermissionLevel("view");
    setExpiresAt("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Share2 className="h-5 w-5 mr-2 text-brand-blue" />
            Share Field
          </h3>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Share <strong>{fieldName}</strong> with another user
            </p>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                User Email *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                required
              />
            </div>

            {/* Permission Level */}
            <div>
              <label
                htmlFor="permission"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Permission Level *
              </label>
              <select
                id="permission"
                value={permissionLevel}
                onChange={(e) =>
                  setPermissionLevel(e.target.value as "view" | "edit")
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                required
              >
                <option value="view">View - Can view field data</option>
                <option value="edit">Edit - Can view and modify field</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                View: Read-only access | Edit: Full access to field
              </p>
            </div>

            {/* Expiration (Optional) */}
            <div>
              <label
                htmlFor="expires"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Expires At (Optional)
              </label>
              <input
                type="datetime-local"
                id="expires"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty for permanent access
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={shareMutation.isPending}
              className="px-4 py-2 text-white bg-brand-blue rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {shareMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sharing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Share Field
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareFieldModal;

import { useMutation } from '@tanstack/react-query';
import { X, Mail, Send } from 'lucide-react';
import React, { useState } from 'react';

import { httpClient } from '../../../shared/api/httpClient';
import { useToast } from '../../../shared/hooks/useToast';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Invite User Modal
 * Form to send invitation emails to new team members
 */
export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('farmer');
  const [message, setMessage] = useState('');

  const { showToast } = useToast();

  // Send invitation mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: string; message?: string }) => {
      // TODO: Implement invitation API endpoint
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, data };
    },
    onSuccess: () => {
      showToast({
        variant: 'success',
        title: 'Invitation Sent',
        description: `Invitation email sent to ${email}`,
      });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      showToast({
        variant: 'error',
        title: 'Invitation Failed',
        description: error.response?.data?.error?.message || 'Failed to send invitation',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast({
        variant: 'error',
        title: 'Validation Error',
        description: 'Email is required',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast({
        variant: 'error',
        title: 'Validation Error',
        description: 'Please enter a valid email address',
      });
      return;
    }

    inviteMutation.mutate({ email, role, message });
  };

  const handleClose = () => {
    setEmail('');
    setRole('farmer');
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-brand-blue" />
            Invite User
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
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
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

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                required
              >
                <option value="admin">Admin - Full access</option>
                <option value="manager">Manager - Manage fields & team</option>
                <option value="farmer">Farmer - Manage own fields</option>
                <option value="viewer">Viewer - Read-only access</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                The user will be assigned this role when they accept the invitation
              </p>
            </div>

            {/* Message (Optional) */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Personal Message (Optional)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message to the invitation..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
              />
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
              disabled={inviteMutation.isPending}
              className="px-4 py-2 text-white bg-brand-blue rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inviteMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteUserModal;


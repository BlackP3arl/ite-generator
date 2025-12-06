'use client';

import { useState } from 'react';

/**
 * WorkflowActions Component
 * Displays role-based action buttons for workflow transitions
 *
 * @param {object} ite - The ITE object
 * @param {object} user - The current user
 * @param {array} availableActions - List of available actions from getAvailableActions()
 * @param {function} onAction - Callback function when action is clicked
 */
export default function WorkflowActions({ ite, user, availableActions, onAction }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState(null);
  const [assignedUserId, setAssignedUserId] = useState('');

  if (!availableActions || availableActions.length === 0) {
    return null;
  }

  const handleAction = async (action) => {
    if (action === 'reject') {
      setShowRejectModal(true);
      return;
    }

    if (action === 'mark_reviewed' || action === 'submit') {
      // Optionally show assign modal
      setAssignType(action === 'mark_reviewed' ? 'approver' : 'reviewer');
      setShowAssignModal(true);
      return;
    }

    setIsLoading(true);
    try {
      await onAction(action);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setIsLoading(true);
    try {
      await onAction('reject', { comment: rejectionReason });
      setShowRejectModal(false);
      setRejectionReason('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignSubmit = async () => {
    setIsLoading(true);
    try {
      const action = assignType === 'approver' ? 'mark_reviewed' : 'submit';
      const params = assignedUserId
        ? { [assignType === 'approver' ? 'approverId' : 'reviewerId']: assignedUserId }
        : {};
      await onAction(action, params);
      setShowAssignModal(false);
      setAssignedUserId('');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionButton = (action) => {
    const buttonConfigs = {
      submit: {
        label: 'Submit for Review',
        className: 'bg-blue-600 hover:bg-blue-700 text-white',
        icon: '📤'
      },
      recall: {
        label: 'Recall',
        className: 'bg-gray-600 hover:bg-gray-700 text-white',
        icon: '↩️'
      },
      mark_reviewed: {
        label: 'Mark as Reviewed',
        className: 'bg-cyan-600 hover:bg-cyan-700 text-white',
        icon: '✓'
      },
      approve: {
        label: 'Approve',
        className: 'bg-green-600 hover:bg-green-700 text-white',
        icon: '✅'
      },
      reject: {
        label: 'Reject',
        className: 'bg-red-600 hover:bg-red-700 text-white',
        icon: '❌'
      },
      edit: {
        label: 'Edit',
        className: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        icon: '✏️'
      },
      delete: {
        label: 'Delete',
        className: 'bg-red-700 hover:bg-red-800 text-white',
        icon: '🗑️'
      },
      view: {
        label: 'View',
        className: 'bg-gray-500 hover:bg-gray-600 text-white',
        icon: '👁️'
      }
    };

    const config = buttonConfigs[action] || {
      label: action,
      className: 'bg-gray-600 hover:bg-gray-700 text-white',
      icon: ''
    };

    return (
      <button
        key={action}
        onClick={() => handleAction(action)}
        disabled={isLoading}
        className={`px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.className}`}
      >
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {availableActions
          .filter(action => action !== 'view') // Don't show view button
          .map(action => getActionButton(action))}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reject ITE</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this ITE. This will be visible to the creator.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border rounded p-2 mb-4 min-h-[100px]"
              placeholder="Enter rejection reason..."
              disabled={isLoading}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={isLoading}
                className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={isLoading || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Rejecting...' : 'Reject ITE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {assignType === 'approver' ? 'Assign Approver (Optional)' : 'Assign Reviewer (Optional)'}
            </h3>
            <p className="text-gray-600 mb-4">
              You can optionally assign a specific {assignType} to this ITE.
            </p>
            <input
              type="text"
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className="w-full border rounded p-2 mb-4"
              placeholder={`${assignType === 'approver' ? 'Approver' : 'Reviewer'} User ID (optional)`}
              disabled={isLoading}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignedUserId('');
                }}
                disabled={isLoading}
                className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

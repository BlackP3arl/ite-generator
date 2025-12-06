'use client';

import { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';

/**
 * AuditLogViewer Component
 * Displays audit log history for an ITE with expandable details
 *
 * @param {number} iteId - The ITE ID
 * @param {boolean} showSummary - Show summary view instead of full logs (default: false)
 */
export default function AuditLogViewer({ iteId, showSummary = false }) {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchAuditData();
  }, [iteId, showSummary]);

  const fetchAuditData = async () => {
    try {
      setIsLoading(true);
      const url = showSummary
        ? `/api/ite/${iteId}/audit-logs?summary=true`
        : `/api/ite/${iteId}/audit-logs`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();

      if (showSummary) {
        setSummary(data.summary);
      } else {
        setLogs(data.logs || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionLabel = (action) => {
    const labels = {
      CREATE: 'Created',
      UPDATE: 'Updated',
      DELETE: 'Deleted',
      SUBMIT: 'Submitted for Review',
      RECALL: 'Recalled',
      MARK_REVIEWED: 'Marked as Reviewed',
      APPROVE: 'Approved',
      REJECT: 'Rejected'
    };
    return labels[action] || action;
  };

  const getActionIcon = (action) => {
    const icons = {
      CREATE: '➕',
      UPDATE: '✏️',
      DELETE: '🗑️',
      SUBMIT: '📤',
      RECALL: '↩️',
      MARK_REVIEWED: '✓',
      APPROVE: '✅',
      REJECT: '❌'
    };
    return icons[action] || '•';
  };

  if (showSummary) {
    if (isLoading) {
      return <div className="text-gray-500">Loading audit summary...</div>;
    }

    if (error) {
      return <div className="text-red-600">Error: {error}</div>;
    }

    if (!summary) {
      return <div className="text-gray-500">No audit data available</div>;
    }

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Audit Timeline</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span className="font-medium">{formatDate(summary.createdAt)}</span>
          </div>
          {summary.submittedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Submitted:</span>
              <span className="font-medium">{formatDate(summary.submittedAt)}</span>
            </div>
          )}
          {summary.reviewedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Reviewed:</span>
              <span className="font-medium">{formatDate(summary.reviewedAt)}</span>
            </div>
          )}
          {summary.approvedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Approved:</span>
              <span className="font-medium">{formatDate(summary.approvedAt)}</span>
            </div>
          )}
          {summary.rejectedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Rejected:</span>
              <span className="font-medium">{formatDate(summary.rejectedAt)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t">
            <span className="text-gray-600">Total Actions:</span>
            <span className="font-medium">{summary.totalActions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status Transitions:</span>
            <span className="font-medium">{summary.transitions}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="font-semibold">Audit History</span>
        <span className="text-gray-500">
          {isExpanded ? '▼' : '▶'} {logs.length} entries
        </span>
      </button>

      {isExpanded && (
        <div className="p-4">
          {isLoading && (
            <div className="text-center text-gray-500 py-4">
              Loading audit logs...
            </div>
          )}

          {error && (
            <div className="text-red-600 py-4">
              Error loading audit logs: {error}
            </div>
          )}

          {!isLoading && !error && logs.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No audit logs available
            </div>
          )}

          {!isLoading && !error && logs.length > 0 && (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getActionIcon(log.action)}</span>
                        <span className="font-medium">{getActionLabel(log.action)}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        by {log.user?.name || log.user?.email || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(log.createdAt)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {log.oldStatus && (
                        <div className="flex items-center gap-1 text-xs">
                          <StatusBadge status={log.oldStatus} className="text-xs" />
                          <span>→</span>
                        </div>
                      )}
                      {log.newStatus && (
                        <StatusBadge status={log.newStatus} className="text-xs" />
                      )}
                    </div>
                  </div>
                  {log.comment && (
                    <div className="mt-2 text-sm bg-yellow-50 border border-yellow-200 rounded p-2">
                      <span className="font-medium">Comment:</span> {log.comment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={fetchAuditData}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}

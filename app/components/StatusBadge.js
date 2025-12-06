'use client';

import { STATUS_CONFIG } from '../../lib/roles';

/**
 * StatusBadge Component
 * Displays a workflow status badge with appropriate styling
 *
 * @param {string} status - The workflow status (DRAFT, PENDING_REVIEW, etc.)
 * @param {string} className - Additional CSS classes (optional)
 * @param {boolean} showIcon - Whether to show the status icon (default: true)
 */
export default function StatusBadge({ status, className = '', showIcon = true }) {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return (
      <span className={`px-2 py-1 rounded text-sm font-medium ${className}`}>
        {status || 'Unknown'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${className}`}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
      }}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
}

/**
 * StatusBadgeList Component
 * Displays a legend of all workflow statuses
 */
export function StatusBadgeList() {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.keys(STATUS_CONFIG).map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
    </div>
  );
}

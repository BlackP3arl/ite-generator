/**
 * Role and Permission Management
 */

// Role definitions
export const ROLES = {
  ADMIN: 'ADMIN',
  ITE_CREATOR: 'ITE_CREATOR',
  ITE_REVIEWER: 'ITE_REVIEWER',
  ITE_APPROVER: 'ITE_APPROVER',
  ITE_VIEWER: 'ITE_VIEWER'
};

// Workflow statuses
export const WORKFLOW_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  IN_REVIEW: 'IN_REVIEW',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

// Human-readable role names
export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.ITE_CREATOR]: 'ITE Creator',
  [ROLES.ITE_REVIEWER]: 'ITE Reviewer',
  [ROLES.ITE_APPROVER]: 'ITE Approver',
  [ROLES.ITE_VIEWER]: 'ITE Viewer'
};

// Status labels with styling
export const STATUS_CONFIG = {
  [WORKFLOW_STATUS.DRAFT]: {
    label: 'Draft',
    color: '#6c757d',
    bgColor: '#e9ecef',
    icon: '📝'
  },
  [WORKFLOW_STATUS.PENDING_REVIEW]: {
    label: 'Pending Review',
    color: '#0d6efd',
    bgColor: '#cfe2ff',
    icon: '⏳'
  },
  [WORKFLOW_STATUS.IN_REVIEW]: {
    label: 'In Review',
    color: '#0dcaf0',
    bgColor: '#cff4fc',
    icon: '👁️'
  },
  [WORKFLOW_STATUS.PENDING_APPROVAL]: {
    label: 'Pending Approval',
    color: '#fd7e14',
    bgColor: '#ffe5d0',
    icon: '⏱️'
  },
  [WORKFLOW_STATUS.APPROVED]: {
    label: 'Approved',
    color: '#198754',
    bgColor: '#d1e7dd',
    icon: '✅'
  },
  [WORKFLOW_STATUS.REJECTED]: {
    label: 'Rejected',
    color: '#dc3545',
    bgColor: '#f8d7da',
    icon: '❌'
  }
};

/**
 * Check if user has a specific role
 */
export function hasRole(user, role) {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if user is admin
 */
export function isAdmin(user) {
  return hasRole(user, ROLES.ADMIN);
}

/**
 * Check if user can view an ITE
 */
export function canViewITE(user, ite) {
  if (!user) return false;

  // Admin can view everything
  if (isAdmin(user)) return true;

  // ITE Viewer can view all ITEs (read-only)
  if (hasRole(user, ROLES.ITE_VIEWER)) return true;

  // Creator can view their own ITEs
  if (ite.creatorId === user.id) return true;

  // Reviewer can view ITEs in review states or assigned to them
  if (hasRole(user, ROLES.ITE_REVIEWER)) {
    if (ite.reviewerId === user.id) return true;
    if ([WORKFLOW_STATUS.PENDING_REVIEW, WORKFLOW_STATUS.IN_REVIEW].includes(ite.status)) {
      return true;
    }
  }

  // Approver can view ITEs in approval state or assigned to them
  if (hasRole(user, ROLES.ITE_APPROVER)) {
    if (ite.approverId === user.id) return true;
    if (ite.status === WORKFLOW_STATUS.PENDING_APPROVAL) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user can edit an ITE
 */
export function canEditITE(user, ite) {
  if (!user) return false;

  // ITE Viewer cannot edit (read-only)
  if (hasRole(user, ROLES.ITE_VIEWER)) return false;

  // Admin can edit everything except approved
  if (isAdmin(user)) {
    return ite.status !== WORKFLOW_STATUS.APPROVED;
  }

  // Creator can edit DRAFT and REJECTED
  if (hasRole(user, ROLES.ITE_CREATOR) && ite.creatorId === user.id) {
    return [WORKFLOW_STATUS.DRAFT, WORKFLOW_STATUS.REJECTED].includes(ite.status);
  }

  // Reviewer can edit when in review states
  if (hasRole(user, ROLES.ITE_REVIEWER)) {
    return [WORKFLOW_STATUS.PENDING_REVIEW, WORKFLOW_STATUS.IN_REVIEW].includes(ite.status);
  }

  return false;
}

/**
 * Check if user can delete an ITE
 */
export function canDeleteITE(user, ite) {
  if (!user) return false;

  // ITE Viewer cannot delete (read-only)
  if (hasRole(user, ROLES.ITE_VIEWER)) return false;

  // Only admin can delete
  if (isAdmin(user)) {
    // Can delete DRAFT or as cleanup for APPROVED
    return [WORKFLOW_STATUS.DRAFT, WORKFLOW_STATUS.APPROVED].includes(ite.status);
  }

  // Creator can delete their own drafts
  if (hasRole(user, ROLES.ITE_CREATOR) && ite.creatorId === user.id) {
    return ite.status === WORKFLOW_STATUS.DRAFT;
  }

  return false;
}

/**
 * Get available actions for a user on an ITE
 */
export function getAvailableActions(user, ite) {
  if (!user || !ite) return [];

  const actions = [];

  // ITE Viewer has no actions (read-only)
  if (hasRole(user, ROLES.ITE_VIEWER)) {
    return ['view'];
  }

  // Admin has all actions except on APPROVED
  if (isAdmin(user)) {
    if (ite.status !== WORKFLOW_STATUS.APPROVED) {
      actions.push('edit', 'delete');
    }
    if (ite.status === WORKFLOW_STATUS.DRAFT) {
      actions.push('submit');
    }
    if ([WORKFLOW_STATUS.PENDING_REVIEW, WORKFLOW_STATUS.IN_REVIEW].includes(ite.status)) {
      actions.push('recall', 'mark_reviewed');
    }
    if (ite.status === WORKFLOW_STATUS.PENDING_APPROVAL) {
      actions.push('approve', 'reject');
    }
    if (ite.status === WORKFLOW_STATUS.APPROVED) {
      actions.push('delete'); // Cleanup
    }
    actions.push('view');
    return [...new Set(actions)];
  }

  // Creator actions
  if (hasRole(user, ROLES.ITE_CREATOR) && ite.creatorId === user.id) {
    if (ite.status === WORKFLOW_STATUS.DRAFT) {
      actions.push('edit', 'delete', 'submit');
    }
    if ([WORKFLOW_STATUS.PENDING_REVIEW, WORKFLOW_STATUS.IN_REVIEW].includes(ite.status)) {
      actions.push('recall');
    }
    if (ite.status === WORKFLOW_STATUS.REJECTED) {
      actions.push('edit', 'submit');
    }
    // Can always view
    actions.push('view');
  }

  // Reviewer actions
  if (hasRole(user, ROLES.ITE_REVIEWER)) {
    if ([WORKFLOW_STATUS.PENDING_REVIEW, WORKFLOW_STATUS.IN_REVIEW].includes(ite.status)) {
      actions.push('view', 'edit', 'mark_reviewed');
    }
  }

  // Approver actions
  if (hasRole(user, ROLES.ITE_APPROVER)) {
    if (ite.status === WORKFLOW_STATUS.PENDING_APPROVAL) {
      actions.push('view', 'approve', 'reject');
    }
  }

  return [...new Set(actions)]; // Remove duplicates
}

/**
 * Validate state transition
 */
export function canTransitionTo(currentStatus, newStatus, userRole) {
  const transitions = {
    [WORKFLOW_STATUS.DRAFT]: {
      [WORKFLOW_STATUS.PENDING_REVIEW]: [ROLES.ITE_CREATOR, ROLES.ADMIN]
    },
    [WORKFLOW_STATUS.PENDING_REVIEW]: {
      [WORKFLOW_STATUS.IN_REVIEW]: [ROLES.ITE_REVIEWER, ROLES.ADMIN],
      [WORKFLOW_STATUS.PENDING_APPROVAL]: [ROLES.ITE_REVIEWER, ROLES.ADMIN], // Reviewer can directly complete review
      [WORKFLOW_STATUS.DRAFT]: [ROLES.ITE_CREATOR, ROLES.ADMIN] // Recall
    },
    [WORKFLOW_STATUS.IN_REVIEW]: {
      [WORKFLOW_STATUS.PENDING_APPROVAL]: [ROLES.ITE_REVIEWER, ROLES.ADMIN],
      [WORKFLOW_STATUS.DRAFT]: [ROLES.ITE_CREATOR, ROLES.ADMIN] // Recall
    },
    [WORKFLOW_STATUS.PENDING_APPROVAL]: {
      [WORKFLOW_STATUS.APPROVED]: [ROLES.ITE_APPROVER, ROLES.ADMIN],
      [WORKFLOW_STATUS.REJECTED]: [ROLES.ITE_APPROVER, ROLES.ADMIN]
    },
    [WORKFLOW_STATUS.REJECTED]: {
      [WORKFLOW_STATUS.DRAFT]: [ROLES.ITE_CREATOR, ROLES.ADMIN]
    }
  };

  const allowedRoles = transitions[currentStatus]?.[newStatus];
  return allowedRoles?.includes(userRole) || false;
}

/**
 * Check if user can create ITEs
 */
export function canCreateITE(user) {
  if (!user) return false;
  return hasRole(user, ROLES.ITE_CREATOR) || isAdmin(user);
}

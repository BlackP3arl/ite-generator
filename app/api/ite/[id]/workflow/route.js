import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  WORKFLOW_STATUS,
  ROLES,
  canTransitionTo,
  isAdmin,
  hasRole
} from '@/lib/roles';
import { createAuditLog } from '@/lib/auditLog';

/**
 * POST /api/ite/[id]/workflow
 * Handle workflow state transitions
 *
 * Body:
 * - action: 'submit' | 'recall' | 'mark_reviewed' | 'approve' | 'reject'
 * - comment: string (optional, required for reject)
 * - reviewerId: string (optional, for assigning reviewer)
 * - approverId: string (optional, for assigning approver)
 */
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const iteId = parseInt(id);

    if (isNaN(iteId)) {
      return NextResponse.json(
        { error: 'Invalid ITE ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, comment, reviewerId, approverId } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Fetch the ITE with all relations
    const ite = await prisma.iTE.findUnique({
      where: { id: iteId },
      include: {
        creator: true,
        reviewer: true,
        approver: true
      }
    });

    if (!ite) {
      return NextResponse.json(
        { error: 'ITE not found' },
        { status: 404 }
      );
    }

    const oldStatus = ite.status;
    let newStatus = oldStatus;
    let updateData = {};
    let auditAction = action.toUpperCase();

    // Handle different workflow actions
    switch (action) {
      case 'submit':
        // Creator submits for review
        if (!hasRole(user, ROLES.ITE_CREATOR) && !isAdmin(user)) {
          return NextResponse.json(
            { error: 'Only creators can submit ITEs' },
            { status: 403 }
          );
        }

        if (ite.creatorId !== user.id && !isAdmin(user)) {
          return NextResponse.json(
            { error: 'You can only submit your own ITEs' },
            { status: 403 }
          );
        }

        if (ite.status !== WORKFLOW_STATUS.DRAFT && ite.status !== WORKFLOW_STATUS.REJECTED) {
          return NextResponse.json(
            { error: 'Can only submit ITEs in DRAFT or REJECTED status' },
            { status: 400 }
          );
        }

        newStatus = WORKFLOW_STATUS.PENDING_REVIEW;
        updateData = {
          status: newStatus,
          submittedAt: new Date(),
          reviewerId: reviewerId || null,
          rejectedAt: null,
          rejectionReason: null
        };
        break;

      case 'recall':
        // Creator recalls from review
        if (!hasRole(user, ROLES.ITE_CREATOR) && !isAdmin(user)) {
          return NextResponse.json(
            { error: 'Only creators can recall ITEs' },
            { status: 403 }
          );
        }

        if (ite.creatorId !== user.id && !isAdmin(user)) {
          return NextResponse.json(
            { error: 'You can only recall your own ITEs' },
            { status: 403 }
          );
        }

        if (![WORKFLOW_STATUS.PENDING_REVIEW, WORKFLOW_STATUS.IN_REVIEW].includes(ite.status)) {
          return NextResponse.json(
            { error: 'Can only recall ITEs in review states' },
            { status: 400 }
          );
        }

        newStatus = WORKFLOW_STATUS.DRAFT;
        updateData = {
          status: newStatus,
          reviewerId: null,
          reviewedAt: null
        };
        break;

      case 'mark_reviewed':
        // Reviewer marks as reviewed
        if (!hasRole(user, ROLES.ITE_REVIEWER) && !isAdmin(user)) {
          return NextResponse.json(
            { error: 'Only reviewers can mark ITEs as reviewed' },
            { status: 403 }
          );
        }

        if (![WORKFLOW_STATUS.PENDING_REVIEW, WORKFLOW_STATUS.IN_REVIEW].includes(ite.status)) {
          return NextResponse.json(
            { error: 'Can only mark reviewed ITEs in review states' },
            { status: 400 }
          );
        }

        newStatus = WORKFLOW_STATUS.PENDING_APPROVAL;
        updateData = {
          status: newStatus,
          reviewedAt: new Date(),
          approverId: approverId || null
        };

        // Auto-assign reviewer if not already assigned
        if (!ite.reviewerId) {
          updateData.reviewerId = user.id;
        }
        break;

      case 'approve':
        // Approver approves ITE
        if (!hasRole(user, ROLES.ITE_APPROVER) && !isAdmin(user)) {
          return NextResponse.json(
            { error: 'Only approvers can approve ITEs' },
            { status: 403 }
          );
        }

        if (ite.status !== WORKFLOW_STATUS.PENDING_APPROVAL) {
          return NextResponse.json(
            { error: 'Can only approve ITEs in PENDING_APPROVAL status' },
            { status: 400 }
          );
        }

        newStatus = WORKFLOW_STATUS.APPROVED;
        updateData = {
          status: newStatus,
          approvedAt: new Date()
        };

        // Auto-assign approver if not already assigned
        if (!ite.approverId) {
          updateData.approverId = user.id;
        }
        break;

      case 'reject':
        // Approver rejects ITE
        if (!hasRole(user, ROLES.ITE_APPROVER) && !isAdmin(user)) {
          return NextResponse.json(
            { error: 'Only approvers can reject ITEs' },
            { status: 403 }
          );
        }

        if (ite.status !== WORKFLOW_STATUS.PENDING_APPROVAL) {
          return NextResponse.json(
            { error: 'Can only reject ITEs in PENDING_APPROVAL status' },
            { status: 400 }
          );
        }

        if (!comment || comment.trim() === '') {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 }
          );
        }

        newStatus = WORKFLOW_STATUS.REJECTED;
        updateData = {
          status: newStatus,
          rejectedAt: new Date(),
          rejectionReason: comment.trim()
        };

        // Auto-assign approver if not already assigned
        if (!ite.approverId) {
          updateData.approverId = user.id;
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // Validate state transition
    if (!canTransitionTo(oldStatus, newStatus, user.role)) {
      return NextResponse.json(
        { error: `Cannot transition from ${oldStatus} to ${newStatus} with role ${user.role}` },
        { status: 403 }
      );
    }

    // Update ITE
    const updatedITE = await prisma.iTE.update({
      where: { id: iteId },
      data: updateData,
      include: {
        creator: true,
        reviewer: true,
        approver: true
      }
    });

    // Create audit log
    await createAuditLog({
      action: auditAction,
      iteId: iteId,
      userId: user.id,
      oldStatus: oldStatus,
      newStatus: newStatus,
      comment: comment || null,
      metadata: {
        reviewerId: updateData.reviewerId,
        approverId: updateData.approverId
      }
    });

    return NextResponse.json({
      success: true,
      ite: updatedITE,
      transition: {
        from: oldStatus,
        to: newStatus,
        action: auditAction
      }
    });

  } catch (error) {
    console.error('Workflow action error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

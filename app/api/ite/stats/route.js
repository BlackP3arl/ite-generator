import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { WORKFLOW_STATUS, ROLES, isAdmin, hasRole } from '@/lib/roles';

/**
 * GET /api/ite/stats
 * Get dashboard statistics based on user role
 *
 * Returns role-specific statistics:
 * - Total ITEs (all users can see)
 * - ITEs in review (PENDING_REVIEW + IN_REVIEW)
 * - ITEs in approval (PENDING_APPROVAL)
 * - My ITEs (for creators)
 * - Assigned to me (for reviewers/approvers)
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Base statistics available to all users
    const totalITEs = await prisma.iTE.count();

    const inReview = await prisma.iTE.count({
      where: {
        status: {
          in: [WORKFLOW_STATUS.PENDING_REVIEW, WORKFLOW_STATUS.IN_REVIEW]
        }
      }
    });

    const inApproval = await prisma.iTE.count({
      where: {
        status: WORKFLOW_STATUS.PENDING_APPROVAL
      }
    });

    const approved = await prisma.iTE.count({
      where: {
        status: WORKFLOW_STATUS.APPROVED
      }
    });

    const rejected = await prisma.iTE.count({
      where: {
        status: WORKFLOW_STATUS.REJECTED
      }
    });

    const drafts = await prisma.iTE.count({
      where: {
        status: WORKFLOW_STATUS.DRAFT
      }
    });

    // Role-specific statistics
    let roleSpecific = {};

    if (hasRole(user, ROLES.ITE_CREATOR)) {
      // Creator-specific stats
      const myITEs = await prisma.iTE.count({
        where: {
          creatorId: user.id
        }
      });

      const myDrafts = await prisma.iTE.count({
        where: {
          creatorId: user.id,
          status: WORKFLOW_STATUS.DRAFT
        }
      });

      const myInReview = await prisma.iTE.count({
        where: {
          creatorId: user.id,
          status: {
            in: [WORKFLOW_STATUS.PENDING_REVIEW, WORKFLOW_STATUS.IN_REVIEW]
          }
        }
      });

      const myInApproval = await prisma.iTE.count({
        where: {
          creatorId: user.id,
          status: WORKFLOW_STATUS.PENDING_APPROVAL
        }
      });

      const myApproved = await prisma.iTE.count({
        where: {
          creatorId: user.id,
          status: WORKFLOW_STATUS.APPROVED
        }
      });

      const myRejected = await prisma.iTE.count({
        where: {
          creatorId: user.id,
          status: WORKFLOW_STATUS.REJECTED
        }
      });

      roleSpecific = {
        myITEs,
        myDrafts,
        myInReview,
        myInApproval,
        myApproved,
        myRejected
      };
    }

    if (hasRole(user, ROLES.ITE_REVIEWER)) {
      // Reviewer-specific stats
      const assignedToMe = await prisma.iTE.count({
        where: {
          reviewerId: user.id
        }
      });

      const pendingMyReview = await prisma.iTE.count({
        where: {
          reviewerId: user.id,
          status: {
            in: [WORKFLOW_STATUS.PENDING_REVIEW, WORKFLOW_STATUS.IN_REVIEW]
          }
        }
      });

      const availableForReview = await prisma.iTE.count({
        where: {
          status: {
            in: [WORKFLOW_STATUS.PENDING_REVIEW, WORKFLOW_STATUS.IN_REVIEW]
          }
        }
      });

      roleSpecific = {
        assignedToMe,
        pendingMyReview,
        availableForReview
      };
    }

    if (hasRole(user, ROLES.ITE_APPROVER)) {
      // Approver-specific stats
      const assignedToMe = await prisma.iTE.count({
        where: {
          approverId: user.id
        }
      });

      const pendingMyApproval = await prisma.iTE.count({
        where: {
          approverId: user.id,
          status: WORKFLOW_STATUS.PENDING_APPROVAL
        }
      });

      const availableForApproval = await prisma.iTE.count({
        where: {
          status: WORKFLOW_STATUS.PENDING_APPROVAL
        }
      });

      roleSpecific = {
        assignedToMe,
        pendingMyApproval,
        availableForApproval
      };
    }

    if (isAdmin(user)) {
      // Admin gets all statistics
      const userStats = await prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true
        }
      });

      roleSpecific = {
        usersByRole: userStats,
        allStats: {
          creators: await prisma.user.count({ where: { role: ROLES.ITE_CREATOR } }),
          reviewers: await prisma.user.count({ where: { role: ROLES.ITE_REVIEWER } }),
          approvers: await prisma.user.count({ where: { role: ROLES.ITE_APPROVER } }),
          viewers: await prisma.user.count({ where: { role: ROLES.ITE_VIEWER } }),
          admins: await prisma.user.count({ where: { role: ROLES.ADMIN } })
        }
      };
    }

    return NextResponse.json({
      success: true,
      stats: {
        total: totalITEs,
        inReview,
        inApproval,
        approved,
        rejected,
        drafts,
        byStatus: {
          [WORKFLOW_STATUS.DRAFT]: drafts,
          [WORKFLOW_STATUS.PENDING_REVIEW]: await prisma.iTE.count({
            where: { status: WORKFLOW_STATUS.PENDING_REVIEW }
          }),
          [WORKFLOW_STATUS.IN_REVIEW]: await prisma.iTE.count({
            where: { status: WORKFLOW_STATUS.IN_REVIEW }
          }),
          [WORKFLOW_STATUS.PENDING_APPROVAL]: inApproval,
          [WORKFLOW_STATUS.APPROVED]: approved,
          [WORKFLOW_STATUS.REJECTED]: rejected
        },
        roleSpecific
      },
      user: {
        role: user.role,
        id: user.id
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

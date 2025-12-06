import { prisma } from './prisma';

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  action,
  iteId,
  userId,
  oldStatus = null,
  newStatus = null,
  comment = null,
  metadata = null
}) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        action,
        iteId,
        userId,
        oldStatus,
        newStatus,
        comment,
        metadata: metadata ? JSON.stringify(metadata) : null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit log failure shouldn't break the operation
    return null;
  }
}

/**
 * Get audit logs for an ITE
 */
export async function getAuditLogs(iteId, options = {}) {
  const { limit = 50, offset = 0 } = options;

  try {
    const logs = await prisma.auditLog.findMany({
      where: { iteId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return logs;
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}

/**
 * Get audit log summary for an ITE
 */
export async function getAuditSummary(iteId) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { iteId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const summary = {
      totalActions: logs.length,
      createdAt: logs[0]?.createdAt,
      submittedAt: logs.find(l => l.action === 'SUBMIT')?.createdAt,
      reviewedAt: logs.find(l => l.action === 'MARK_REVIEWED')?.createdAt,
      approvedAt: logs.find(l => l.action === 'APPROVE')?.createdAt,
      rejectedAt: logs.find(l => l.action === 'REJECT')?.createdAt,
      lastModifiedBy: logs[logs.length - 1]?.user,
      transitions: logs.filter(l => l.newStatus !== null).length
    };

    return summary;
  } catch (error) {
    console.error('Failed to get audit summary:', error);
    return null;
  }
}

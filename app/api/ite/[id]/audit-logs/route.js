import { NextResponse } from 'next/server';
import { canAccessITE } from '@/lib/auth';
import { getAuditLogs, getAuditSummary } from '@/lib/auditLog';

/**
 * GET /api/ite/[id]/audit-logs
 * Get audit logs for an ITE
 *
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - summary: boolean (if true, returns summary instead of full logs)
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const iteId = parseInt(id);

    if (isNaN(iteId)) {
      return NextResponse.json(
        { error: 'Invalid ITE ID' },
        { status: 400 }
      );
    }

    // Check if user can access this ITE
    const { allowed, user, ite } = await canAccessITE(iteId);

    if (!allowed || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!ite) {
      return NextResponse.json(
        { error: 'ITE not found' },
        { status: 404 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const summaryOnly = searchParams.get('summary') === 'true';

    if (summaryOnly) {
      // Return audit summary
      const summary = await getAuditSummary(iteId);
      return NextResponse.json({
        success: true,
        summary
      });
    } else {
      // Return full audit logs
      const logs = await getAuditLogs(iteId, { limit, offset });

      return NextResponse.json({
        success: true,
        logs,
        pagination: {
          limit,
          offset,
          count: logs.length
        }
      });
    }

  } catch (error) {
    console.error('Audit logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

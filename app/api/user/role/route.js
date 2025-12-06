import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { validateCSRF } from '../../../../lib/csrf';
import { applyRateLimit, RATE_LIMITS } from '../../../../lib/rateLimit';

// Update user role (admin only)
export async function PUT(request) {
  try {
    // Rate limiting
    const rateLimitResult = applyRateLimit(request, RATE_LIMITS.ADMIN);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        {
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }

    // CSRF protection
    const csrfValidation = validateCSRF(request);
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: csrfValidation.error },
        { status: 403 }
      );
    }

    await requireAdmin();

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    if (role !== 'user' && role !== 'viewer' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user", "viewer", or "admin"' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Error updating role:', error);

    if (error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

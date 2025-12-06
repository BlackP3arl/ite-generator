import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser, requireAdmin } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { validateCSRF } from '../../../../lib/csrf';
import { applyRateLimit, RATE_LIMITS } from '../../../../lib/rateLimit';

// Set or update a user's password (admin only)
export async function POST(request) {
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

    // Only admins can set passwords
    await requireAdmin();

    const { email, password, name, role } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role && role !== 'user' && role !== 'viewer' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user", "viewer", or "admin"' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update existing user's password
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          ...(name && { name }), // Update name if provided
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        },
      });
    } else {
      // Create new user with password
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || email.split('@')[0], // Use email prefix as default name
          role: role || 'user', // Use provided role or default to user
        },
      });

      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      });
    }
  } catch (error) {
    console.error('Error setting password:', error);

    if (error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to set password' },
      { status: 500 }
    );
  }
}

// Allow user to change their own password
export async function PUT(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'No password set for this account' },
        { status: 400 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}

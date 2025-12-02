import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../../../../lib/auth';

const prisma = new PrismaClient();

// Get all users (admin only)
export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        azureId: true,
        password: true, // Just to check if password exists (we'll return boolean)
        createdAt: true,
        updatedAt: true,
      },
    });

    // Transform to hide actual password hash
    const usersWithoutHash = users.map((user) => ({
      ...user,
      password: !!user.password, // Convert to boolean
    }));

    return NextResponse.json(usersWithoutHash);
  } catch (error) {
    console.error('Error fetching users:', error);

    if (error.message === 'Forbidden: Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

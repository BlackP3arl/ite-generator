import { getServerSession } from 'next-auth';
import { authOptions } from '../app/api/auth/[...nextauth]/route';
import { prisma } from './prisma';

// Get current session on server side
export async function getSession() {
  return await getServerSession(authOptions);
}

// Get current user with full details
export async function getCurrentUser() {
  const session = await getSession();

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return user;
}

// Check if user is authenticated
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

// Check if user has admin role
export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}

// Check if user owns a resource or is admin
export async function canAccessResource(userId) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return false;
  }

  // Admin can access all resources
  if (currentUser.role === 'admin') {
    return true;
  }

  // User can access their own resources
  return currentUser.id === userId;
}

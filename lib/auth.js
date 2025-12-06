import { getServerSession } from 'next-auth';
import { authOptions } from '../app/api/auth/[...nextauth]/route';
import { prisma } from './prisma';
import { ROLES, isAdmin, hasRole } from './roles';

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

  if (!user || !isAdmin(user)) {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}

// Require specific role
export async function requireRole(role) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!hasRole(user, role) && !isAdmin(user)) {
    throw new Error(`Forbidden: ${role} access required`);
  }

  return user;
}

// Require reviewer role
export async function requireReviewer() {
  return await requireRole(ROLES.ITE_REVIEWER);
}

// Require approver role
export async function requireApprover() {
  return await requireRole(ROLES.ITE_APPROVER);
}

// Check if user owns a resource or is admin
export async function canAccessResource(userId) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return false;
  }

  // Admin can access all resources
  if (isAdmin(currentUser)) {
    return true;
  }

  // User can access their own resources
  return currentUser.id === userId;
}

// Check if user can access ITE (expanded version)
export async function canAccessITE(iteId) {
  const user = await getCurrentUser();

  if (!user) {
    return { allowed: false, user: null, ite: null };
  }

  const ite = await prisma.iTE.findUnique({
    where: { id: iteId },
    include: {
      creator: true,
      reviewer: true,
      approver: true
    }
  });

  if (!ite) {
    return { allowed: false, user, ite: null };
  }

  // Use permission function from roles.js
  const { canViewITE } = require('./roles');
  const allowed = canViewITE(user, ite);

  return { allowed, user, ite };
}

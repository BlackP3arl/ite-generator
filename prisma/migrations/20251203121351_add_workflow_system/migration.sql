-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ITE_CREATOR', 'ITE_REVIEWER', 'ITE_APPROVER', 'ITE_VIEWER');

-- Add temporary column for User role conversion
ALTER TABLE "User" ADD COLUMN "roleNew" "UserRole";

-- Convert existing roles to new enum values
UPDATE "User" SET "roleNew" = 'ADMIN' WHERE "role" = 'admin';
UPDATE "User" SET "roleNew" = 'ITE_CREATOR' WHERE "role" = 'user';
UPDATE "User" SET "roleNew" = 'ITE_VIEWER' WHERE "role" IS NULL OR ("role" != 'admin' AND "role" != 'user');

-- Drop old role column and rename new one
ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" RENAME COLUMN "roleNew" TO "role";
ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ITE_VIEWER';

-- Rename ITE.userId to ITE.creatorId
ALTER TABLE "ITE" RENAME COLUMN "userId" TO "creatorId";

-- Add new workflow fields to ITE table
ALTER TABLE "ITE" ADD COLUMN "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "ITE" ADD COLUMN "submittedAt" TIMESTAMP(3);
ALTER TABLE "ITE" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "ITE" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "ITE" ADD COLUMN "rejectedAt" TIMESTAMP(3);
ALTER TABLE "ITE" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "ITE" ADD COLUMN "reviewerId" TEXT;
ALTER TABLE "ITE" ADD COLUMN "approverId" TEXT;

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "oldStatus" "WorkflowStatus",
    "newStatus" "WorkflowStatus",
    "comment" TEXT,
    "metadata" TEXT,
    "userId" TEXT NOT NULL,
    "iteId" INTEGER NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ITE_status_idx" ON "ITE"("status");

-- CreateIndex
CREATE INDEX "ITE_creatorId_idx" ON "ITE"("creatorId");

-- CreateIndex
CREATE INDEX "ITE_reviewerId_idx" ON "ITE"("reviewerId");

-- CreateIndex
CREATE INDEX "ITE_approverId_idx" ON "ITE"("approverId");

-- CreateIndex
CREATE INDEX "AuditLog_iteId_idx" ON "AuditLog"("iteId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ITE" ADD CONSTRAINT "ITE_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITE" ADD CONSTRAINT "ITE_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_iteId_fkey" FOREIGN KEY ("iteId") REFERENCES "ITE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

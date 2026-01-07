-- AlterTable
ALTER TABLE "ITE" ADD COLUMN     "prNumber" TEXT;

-- RenameForeignKey
ALTER TABLE "ITE" RENAME CONSTRAINT "ITE_userId_fkey" TO "ITE_creatorId_fkey";

-- CreateTable
CREATE TABLE "ITE" (
    "id" SERIAL NOT NULL,
    "iteNumber" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "runningNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT NOT NULL,
    "itsFields" TEXT NOT NULL,
    "comparisonData" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "comments" TEXT,

    CONSTRAINT "ITE_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ITE_iteNumber_key" ON "ITE"("iteNumber");

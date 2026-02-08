/*
  Warnings:

  - You are about to drop the column `aiUsed` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "aiUsed",
ADD COLUMN     "aiCreditsThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aiCreditsTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resumeLastGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "resumesThisMonth" INTEGER NOT NULL DEFAULT 0;

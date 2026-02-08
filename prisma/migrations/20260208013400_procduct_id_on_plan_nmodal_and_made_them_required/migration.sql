/*
  Warnings:

  - A unique constraint covering the columns `[stripeProductId]` on the table `Plan` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stripeProductId` to the `Plan` table without a default value. This is not possible if the table is not empty.
  - Made the column `stripePriceId` on table `Plan` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "stripeProductId" TEXT NOT NULL,
ALTER COLUMN "stripePriceId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Plan_stripeProductId_key" ON "Plan"("stripeProductId");

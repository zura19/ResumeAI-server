/*
  Warnings:

  - You are about to drop the column `stripePaymentIntentId` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `invoice` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripeSubscriptionId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Payment_stripePaymentIntentId_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "stripePaymentIntentId",
ADD COLUMN     "invoice" TEXT NOT NULL,
ADD COLUMN     "stripeSubscriptionId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeSubscriptionId_key" ON "Payment"("stripeSubscriptionId");

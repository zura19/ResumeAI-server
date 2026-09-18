-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('facebook', 'github', 'portfolio', 'linkedin', 'twitter', 'website', 'instagram', 'other');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "url" TEXT;

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "LinkType" NOT NULL DEFAULT 'other',
    "order" INTEGER NOT NULL DEFAULT 0,
    "generatedResumeId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Link_generatedResumeId_order_idx" ON "Link"("generatedResumeId", "order");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_generatedResumeId_fkey" FOREIGN KEY ("generatedResumeId") REFERENCES "GeneratedResume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

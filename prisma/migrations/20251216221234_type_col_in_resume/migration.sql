-- CreateEnum
CREATE TYPE "ResumeType" AS ENUM ('classic', 'modern');

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "type" "ResumeType" NOT NULL DEFAULT 'modern';

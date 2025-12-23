-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiLastUsedAt" TIMESTAMP(3),
ADD COLUMN     "aiUsed" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_generatedResumeId_fkey";

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_generatedResumeId_fkey" FOREIGN KEY ("generatedResumeId") REFERENCES "GeneratedResume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

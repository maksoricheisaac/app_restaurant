-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('new', 'read', 'replied', 'closed', 'archived');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'new';

-- CreateIndex
CREATE INDEX "Message_tenantId_status_idx" ON "Message"("tenantId", "status");

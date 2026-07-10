-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('pending', 'accepted', 'declined', 'revoked', 'expired');

-- CreateTable
CREATE TABLE "MembershipInvite" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'pending',
    "invitedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MembershipInvite_tokenHash_key" ON "MembershipInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "MembershipInvite_tenantId_idx" ON "MembershipInvite"("tenantId");

-- CreateIndex
CREATE INDEX "MembershipInvite_tenantId_status_idx" ON "MembershipInvite"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MembershipInvite_email_idx" ON "MembershipInvite"("email");

-- AddForeignKey
ALTER TABLE "MembershipInvite" ADD CONSTRAINT "MembershipInvite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipInvite" ADD CONSTRAINT "MembershipInvite_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Au plus une invitation PENDING par (tenant, email) à la fois — évite
-- d'empiler des invitations dupliquées pour la même personne.
CREATE UNIQUE INDEX "MembershipInvite_one_pending_per_email_key"
  ON "MembershipInvite"("tenantId", "email")
  WHERE "status" = 'pending';

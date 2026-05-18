/*
  Warnings:

  - The `plan` column on the `Tenant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Tenant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `platformRole` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('free', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'suspended', 'trial', 'expired');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'banned');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('user', 'support', 'super_admin');

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "plan",
ADD COLUMN     "plan" "TenantPlan" NOT NULL DEFAULT 'free',
DROP COLUMN "status",
ADD COLUMN     "status" "TenantStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "status",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'active',
DROP COLUMN "platformRole",
ADD COLUMN     "platformRole" "PlatformRole" NOT NULL DEFAULT 'user';

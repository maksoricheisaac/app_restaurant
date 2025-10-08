/*
  Warnings:

  - The `role` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('admin', 'owner', 'manager', 'head_chef', 'chef', 'waiter', 'cashier', 'user');

-- CreateEnum
CREATE TYPE "public"."Permission" AS ENUM ('VIEW_DASHBOARD', 'VIEW_ANALYTICS', 'VIEW_ORDERS', 'CREATE_ORDERS', 'UPDATE_ORDERS', 'DELETE_ORDERS', 'MANAGE_ORDER_STATUS', 'VIEW_MENU', 'CREATE_MENU_ITEMS', 'UPDATE_MENU_ITEMS', 'DELETE_MENU_ITEMS', 'VIEW_TABLES', 'MANAGE_TABLES', 'VIEW_RESERVATIONS', 'CREATE_RESERVATIONS', 'UPDATE_RESERVATIONS', 'DELETE_RESERVATIONS', 'VIEW_CUSTOMERS', 'MANAGE_CUSTOMERS', 'VIEW_CASH_REGISTER', 'MANAGE_PAYMENTS', 'MANAGE_TRANSACTIONS', 'VIEW_REPORTS', 'VIEW_INVENTORY', 'MANAGE_INVENTORY', 'MANAGE_STOCK', 'VIEW_STAFF', 'MANAGE_STAFF', 'MANAGE_PERMISSIONS', 'VIEW_SETTINGS', 'MANAGE_SETTINGS', 'VIEW_MESSAGES', 'MANAGE_MESSAGES');

-- AlterTable
ALTER TABLE "public"."user" DROP COLUMN "role",
ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "permission" "public"."Permission" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "public"."Permission" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_permission_key" ON "public"."RolePermission"("role", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permission_key" ON "public"."UserPermission"("userId", "permission");

-- AddForeignKey
ALTER TABLE "public"."UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RateLimit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `MenuItem` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to drop the column `customerId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Order` table. All the data in the column will be lost.
  - You are about to alter the column `total` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `price` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to drop the column `avgOrder` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `customers` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `orders` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `revenue` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `guests` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `specialRequests` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `capacity` on the `Table` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Table` table. All the data in the column will be lost.
  - You are about to drop the column `isAvailable` on the `Table` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Table` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Table` table. All the data in the column will be lost.
  - You are about to drop the column `joinDate` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `lastOrder` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `totalOrders` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `totalSpent` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Category_name_key";

-- DropIndex
DROP INDEX "RateLimit_ipAddress_window_key";

-- DropIndex
DROP INDEX "RateLimit_expiresAt_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Category";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RateLimit";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Créer un utilisateur par défaut pour les commandes existantes
INSERT OR IGNORE INTO "user" ("id", "name", "email", "emailVerified", "role", "phone", "address", "status", "notes", "createdAt", "updatedAt") 
VALUES ('default-user', 'Client par défaut', 'default@example.com', false, 'user', NULL, NULL, 'active', 'Utilisateur créé automatiquement pour les commandes existantes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Créer des catégories par défaut
INSERT OR IGNORE INTO "MenuCategory" ("id", "name") VALUES ('default-category', 'Catégorie par défaut');

CREATE TABLE "new_MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "image" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MenuItem" ("categoryId", "description", "id", "image", "name", "price") SELECT COALESCE("categoryId", 'default-category'), "description", "id", "image", "name", CAST("price" AS REAL) FROM "MenuItem";
DROP TABLE "MenuItem";
ALTER TABLE "new_MenuItem" RENAME TO "MenuItem";

CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL DEFAULT 'Message par défaut',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Message" ("createdAt", "id", "content") SELECT "createdAt", "id", COALESCE("message", 'Message par défaut') FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";

CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "type" TEXT NOT NULL DEFAULT 'dine_in',
    "userId" TEXT NOT NULL DEFAULT 'default-user',
    "tableId" TEXT,
    "total" REAL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "id", "status", "tableId", "total", "type", "updatedAt", "userId") SELECT "createdAt", "id", "status", "tableId", CAST("total" AS REAL), COALESCE("type", 'dine_in'), "updatedAt", COALESCE("customerId", 'default-user') FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";

CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL DEFAULT 'default-category',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" REAL NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("id", "image", "name", "orderId", "price", "quantity", "menuItemId") SELECT "id", "image", "name", "orderId", CAST("price" AS REAL), "quantity", COALESCE("menuItemId", 'default-category') FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";

CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT 'Rapport par défaut',
    "content" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Report" ("createdAt", "id", "type", "title") SELECT "createdAt", "id", "type", COALESCE("title", 'Rapport par défaut') FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";

CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'default-user',
    "tableId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("createdAt", "date", "id", "status", "tableId", "updatedAt", "userId") SELECT "createdAt", "date", "id", "status", "tableId", "updatedAt", COALESCE("customerId", 'default-user') FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";

CREATE TABLE "new_Table" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 4,
    "status" TEXT NOT NULL DEFAULT 'available'
);
INSERT INTO "new_Table" ("id", "number", "seats", "status") SELECT "id", "number", COALESCE("capacity", 4), CASE WHEN "isAvailable" = 1 THEN 'available' ELSE 'occupied' END FROM "Table";
DROP TABLE "Table";
ALTER TABLE "new_Table" RENAME TO "Table";
CREATE UNIQUE INDEX "Table_number_key" ON "Table"("number");

CREATE TABLE "new_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "phone" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_user" ("address", "createdAt", "email", "emailVerified", "id", "image", "name", "notes", "phone", "role", "status", "updatedAt") SELECT "address", "createdAt", "email", "emailVerified", "id", "image", "name", "notes", "phone", "role", COALESCE("status", 'active'), "updatedAt" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

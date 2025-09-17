/*
  Warnings:

  - You are about to drop the column `content` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `read` on the `Message` table. All the data in the column will be lost.
  - Added the required column `customerName` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT NOT NULL DEFAULT 'Client anonyme',
    "email" TEXT NOT NULL DEFAULT 'anonyme@example.com',
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL DEFAULT 'Message migré automatiquement',
    "type" TEXT,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "source" TEXT NOT NULL DEFAULT 'contact-form',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Message" ("createdAt", "id", "customerName", "email", "message", "updatedAt") 
SELECT "createdAt", "id", 'Client anonyme', 'anonyme@example.com', COALESCE("content", 'Message migré automatiquement'), "createdAt" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";

CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "time" TEXT,
    "guests" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "specialRequests" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    "tableId" TEXT,
    "customerName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("createdAt", "date", "id", "status", "tableId", "updatedAt", "userId") 
SELECT "createdAt", "date", "id", "status", "tableId", "updatedAt", "userId" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

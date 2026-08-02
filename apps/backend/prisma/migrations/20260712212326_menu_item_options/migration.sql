-- AlterTable
ALTER TABLE "OrderItemsOnOrders" ADD COLUMN     "options" JSONB;

-- CreateTable
CREATE TABLE "MenuItemOptionGroup" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MenuItemOptionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemOption" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceDelta" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MenuItemOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuItemOptionGroup_menuItemId_idx" ON "MenuItemOptionGroup"("menuItemId");

-- CreateIndex
CREATE INDEX "MenuItemOptionGroup_menuItemId_deletedAt_idx" ON "MenuItemOptionGroup"("menuItemId", "deletedAt");

-- CreateIndex
CREATE INDEX "MenuItemOption_groupId_idx" ON "MenuItemOption"("groupId");

-- CreateIndex
CREATE INDEX "MenuItemOption_groupId_deletedAt_idx" ON "MenuItemOption"("groupId", "deletedAt");

-- AddForeignKey
ALTER TABLE "MenuItemOptionGroup" ADD CONSTRAINT "MenuItemOptionGroup_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemOption" ADD CONSTRAINT "MenuItemOption_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MenuItemOptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

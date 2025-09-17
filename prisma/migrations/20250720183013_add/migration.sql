-- CreateIndex
CREATE INDEX "MenuItem_name_idx" ON "MenuItem"("name");

-- CreateIndex
CREATE INDEX "MenuItem_description_idx" ON "MenuItem"("description");

-- CreateIndex
CREATE INDEX "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");

-- CreateIndex
CREATE INDEX "MenuItem_price_idx" ON "MenuItem"("price");

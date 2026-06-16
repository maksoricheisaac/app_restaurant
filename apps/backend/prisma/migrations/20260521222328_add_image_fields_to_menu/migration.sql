-- AlterTable
ALTER TABLE "MenuCategory" ADD COLUMN     "imagePathname" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "imagePathname" TEXT;

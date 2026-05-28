-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "wholesaleMinQuantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "wholesalePrice" DOUBLE PRECISION;

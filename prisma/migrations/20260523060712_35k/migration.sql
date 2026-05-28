/*
  Warnings:

  - The values [CREDIT_CARD,DEBIT_CARD,PAYPAL,CHEQUE,BANK_TRANSFER,UPI,NETBANKING] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `avatarUrl` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `addressId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `wholesaleMinQuantity` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `wholesalePrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `detail` on the `ProductImage` table. All the data in the column will be lost.
  - You are about to drop the `Address` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CartItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rating` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserNotification` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `customerEmail` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPhone` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH_ON_DELIVERY', 'ONLINE');
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_userId_fkey";

-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_userId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_cartId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_addressId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_productId_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserNotification" DROP CONSTRAINT "UserNotification_userId_fkey";

-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "avatarUrl",
DROP COLUMN "role";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "addressId",
DROP COLUMN "userId",
ADD COLUMN     "customerEmail" TEXT NOT NULL,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "customerPhone" TEXT NOT NULL,
ALTER COLUMN "shippingAddress" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "wholesaleMinQuantity",
DROP COLUMN "wholesalePrice";

-- AlterTable
ALTER TABLE "ProductImage" DROP COLUMN "detail";

-- DropTable
DROP TABLE "Address";

-- DropTable
DROP TABLE "Cart";

-- DropTable
DROP TABLE "CartItem";

-- DropTable
DROP TABLE "Rating";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserNotification";

-- DropEnum
DROP TYPE "AdminRole";

-- DropEnum
DROP TYPE "NotificationType";

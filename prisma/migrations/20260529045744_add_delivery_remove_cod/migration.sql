/*
  Warnings:

  - The values [CASH_ON_DELIVERY] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `deliveryOption` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeliveryOption" AS ENUM ('CUSTOMER_PICKUP', 'DELHI', 'OUTSIDE_DELHI');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('ONLINE');
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryOption" "DeliveryOption" NOT NULL;

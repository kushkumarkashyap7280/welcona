/*
  Warnings:

  - The values [DELHI,OUTSIDE_DELHI] on the enum `DeliveryOption` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeliveryOption_new" AS ENUM ('CUSTOMER_PICKUP', 'HOME_DELIVERY');
ALTER TABLE "Order" ALTER COLUMN "deliveryOption" TYPE "DeliveryOption_new" USING ("deliveryOption"::text::"DeliveryOption_new");
ALTER TYPE "DeliveryOption" RENAME TO "DeliveryOption_old";
ALTER TYPE "DeliveryOption_new" RENAME TO "DeliveryOption";
DROP TYPE "public"."DeliveryOption_old";
COMMIT;

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'WHATSAPP';

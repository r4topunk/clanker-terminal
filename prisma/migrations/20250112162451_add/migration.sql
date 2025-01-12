/*
  Warnings:

  - You are about to drop the column `price` on the `TokenPrice` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TokenPrice_address_rowCreatedAt_idx";

-- AlterTable
ALTER TABLE "TokenPrice" DROP COLUMN "price",
ADD COLUMN     "fdvUsd" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "marketCapUsd" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "priceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "totalReserveInUsd" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "totalSupply" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "volumeUsdH24" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- CreateIndex
CREATE INDEX "TokenPrice_address_rowCreatedAt_fdvUsd_idx" ON "TokenPrice"("address", "rowCreatedAt", "fdvUsd");

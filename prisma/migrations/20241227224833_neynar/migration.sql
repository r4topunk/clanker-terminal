/*
  Warnings:

  - You are about to alter the column `neynarScore` on the `UserMetrics` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "UserMetrics" ALTER COLUMN "neynarScore" SET DATA TYPE DOUBLE PRECISION;

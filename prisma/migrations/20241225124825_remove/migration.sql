/*
  Warnings:

  - You are about to drop the `CastMetrics` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CastMetrics" DROP CONSTRAINT "CastMetrics_hash_fkey";

-- DropTable
DROP TABLE "CastMetrics";

/*
  Warnings:

  - You are about to drop the `UserMetrics` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserMetrics" DROP CONSTRAINT "UserMetrics_fid_fkey";

-- DropTable
DROP TABLE "UserMetrics";

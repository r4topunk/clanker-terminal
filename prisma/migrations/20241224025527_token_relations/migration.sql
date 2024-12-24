/*
  Warnings:

  - Added the required column `tokenAddress` to the `Cast` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userFid` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cast" ADD COLUMN     "tokenAddress" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "userFid" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Cast" ADD CONSTRAINT "Cast_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "Token"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_userFid_fkey" FOREIGN KEY ("userFid") REFERENCES "User"("fid") ON DELETE RESTRICT ON UPDATE CASCADE;

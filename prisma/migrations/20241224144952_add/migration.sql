-- DropForeignKey
ALTER TABLE "Cast" DROP CONSTRAINT "Cast_tokenAddress_fkey";

-- AddForeignKey
ALTER TABLE "Cast" ADD CONSTRAINT "Cast_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "Token"("address") ON DELETE CASCADE ON UPDATE CASCADE;

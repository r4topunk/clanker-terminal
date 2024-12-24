-- DropForeignKey
ALTER TABLE "Cast" DROP CONSTRAINT "Cast_fid_fkey";

-- DropForeignKey
ALTER TABLE "CastMetrics" DROP CONSTRAINT "CastMetrics_hash_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_userFid_fkey";

-- DropForeignKey
ALTER TABLE "TokenPrice" DROP CONSTRAINT "TokenPrice_address_fkey";

-- DropForeignKey
ALTER TABLE "UserMetrics" DROP CONSTRAINT "UserMetrics_fid_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_fid_fkey";

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_fid_fkey" FOREIGN KEY ("fid") REFERENCES "User"("fid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMetrics" ADD CONSTRAINT "UserMetrics_fid_fkey" FOREIGN KEY ("fid") REFERENCES "User"("fid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cast" ADD CONSTRAINT "Cast_fid_fkey" FOREIGN KEY ("fid") REFERENCES "User"("fid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CastMetrics" ADD CONSTRAINT "CastMetrics_hash_fkey" FOREIGN KEY ("hash") REFERENCES "Cast"("hash") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_userFid_fkey" FOREIGN KEY ("userFid") REFERENCES "User"("fid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenPrice" ADD CONSTRAINT "TokenPrice_address_fkey" FOREIGN KEY ("address") REFERENCES "Token"("address") ON DELETE CASCADE ON UPDATE CASCADE;

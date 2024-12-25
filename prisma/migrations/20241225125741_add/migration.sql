-- AlterTable
ALTER TABLE "Cast" ADD COLUMN     "parent_fid" INTEGER,
ADD COLUMN     "parent_hash" TEXT;

-- AddForeignKey
ALTER TABLE "Cast" ADD CONSTRAINT "Cast_parent_fid_fkey" FOREIGN KEY ("parent_fid") REFERENCES "User"("fid") ON DELETE CASCADE ON UPDATE CASCADE;

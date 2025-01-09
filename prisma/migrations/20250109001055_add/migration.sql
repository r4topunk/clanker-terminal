-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "createdAt" TIMESTAMP(3),
ADD COLUMN     "pair" TEXT,
ADD COLUMN     "poolAddress" TEXT,
ADD COLUMN     "txHash" TEXT,
ADD COLUMN     "type" TEXT;

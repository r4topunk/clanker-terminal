-- AlterTable
ALTER TABLE "User" ADD COLUMN     "followers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "following" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "neynarScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "relevance" INTEGER NOT NULL DEFAULT 0;

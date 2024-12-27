/*
  Warnings:

  - Made the column `parent_fid` on table `Cast` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Cast" ALTER COLUMN "parent_fid" SET NOT NULL;

import { Prisma, PrismaClient } from "@prisma/client";
import { extractContractAddress, isDeployEvent } from "../lib/clanker";
import neynar from "../lib/neynar";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const clanker = await prisma.user.findFirstOrThrow({
    where: { username: "clanker" },
  });

  let cursor: string | undefined;
  let hasNext = true;

  const parentUsers: Prisma.UserCreateManyInput[] = [];
  const tokens: Prisma.TokenCreateManyInput[] = [];
  const castsData: Prisma.CastCreateManyInput[] = [];

  let nonDeployCount = 0;
  // let noContractAddressCount = 0;
  let processedCount = 0;
  let totalProcessedCount = 0;

  while (hasNext) {
    const { casts, next } = await neynar.fetchRepliesAndRecastsForUser({
      fid: clanker.fid,
      limit: 50,
      cursor,
    });

    console.log(
      `[${new Date().toISOString()}] Processing ${casts.length} casts`
    );

    for (const cast of casts) {
      if (!isDeployEvent(cast)) {
        nonDeployCount++;
        continue;
      }

      const contractAddress = extractContractAddress(cast.text);
      if (!contractAddress) {
        // noContractAddressCount++;
        continue;
      }

      processedCount++;
      totalProcessedCount++;

      parentUsers.push({ fid: cast.parent_author.fid });
      tokens.push({
        address: contractAddress,
        chainId: 8453,
        userFid: cast.parent_author.fid,
      });
      castsData.push({
        hash: cast.hash,
        fid: clanker.fid,
        parent_fid: cast.parent_author.fid,
        parent_hash: cast.parent_hash,
        castDate: cast.timestamp,
        tokenAddress: contractAddress,
      });
    }

    // console.log(`Casts without contract address: ${noContractAddressCount}`);
    console.log(`Non-deploy casts: ${nonDeployCount}`);
    console.log(`Processed casts: ${processedCount}`);
    console.log(`Total processed casts: ${totalProcessedCount}`);

    nonDeployCount = 0;
    // noContractAddressCount = 0;
    processedCount = 0;

    // Create parent users
    await prisma.user.createMany({
      data: parentUsers,
      skipDuplicates: true,
    });

    // Create tokens
    await prisma.token.createMany({
      data: tokens,
      skipDuplicates: true,
    });

    // Create casts
    await prisma.cast.createMany({
      data: castsData,
      skipDuplicates: true,
    });

    cursor = next.cursor || undefined;
    hasNext = !!next.cursor;

    // Reset arrays for next batch
    parentUsers.length = 0;
    tokens.length = 0;
    castsData.length = 0;
  }
}

main()
  .then(() => console.log("Database seeded successfully!"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

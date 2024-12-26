import { Prisma, PrismaClient } from "@prisma/client";
import { extractContractAddress, isDeployEvent } from "../lib/clanker";
import neynar from "../lib/neynar";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  await seedCasts();
  await seedUsers();
}

async function seedUsers() {
  const batchSize = 100;
  let hasMore = true;

  while (hasMore) {
    const users = await prisma.user.findMany({
      take: batchSize,
      where: { username: null },
    });

    if (users.length === 0) {
      hasMore = false;
      break;
    }

    const usersFids = users.map((user) => user.fid);
    console.log(`Fetching ${usersFids.length} users from Neynar`);
    const neynarUsers = await neynar.fetchBulkUsers({ fids: usersFids });

    const usersToInsert: Prisma.UserUpdateManyMutationInput[] = [];
    const walletsToInsert: Prisma.WalletCreateManyInput[] = [];
    const userMetricsToInsert: Prisma.UserMetricsCreateManyInput[] = [];

    for (const user of neynarUsers.users) {
      if (user === null) {
        continue;
      }

      usersToInsert.push({
        fid: user.fid,
        username: user.username,
      });

      if (
        user.verified_addresses.eth_addresses &&
        user.verified_addresses.eth_addresses.length > 0
      ) {
        walletsToInsert.push({
          fid: user.fid,
          address: user.verified_addresses.eth_addresses[0],
        });
      }

      userMetricsToInsert.push({
        fid: user.fid,
        followers: user.follower_count,
        following: user.following_count,
        neynarScore: user.experimental?.neynar_user_score,
      });
    }

    const usersToUpdate = neynarUsers.users
      .filter((user) => user !== null)
      .map((user) => ({
        fid: user.fid,
        username: user.username,
      }));

    console.log(`Updating ${usersToUpdate.length} users within a transaction`);
    await prisma.$transaction(
      usersToUpdate.map((user) =>
        prisma.user.update({
          where: { fid: user.fid },
          data: { username: user.username },
        })
      )
    );

    console.log(`Inserting ${walletsToInsert.length} wallets`);
    await prisma.wallet.createMany({
      data: walletsToInsert,
      skipDuplicates: true,
    });

    console.log(`Inserting ${userMetricsToInsert.length} user metrics`);
    await prisma.userMetrics.createMany({
      data: userMetricsToInsert,
      skipDuplicates: true,
    });
  }
}

async function seedCasts() {
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
  let duplicateCount = 0;

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
    const createCastsResult = await prisma.cast.createMany({
      data: castsData,
      skipDuplicates: true,
    });

    cursor = next.cursor || undefined;
    hasNext = !!next.cursor;

    // Calculate duplicates in this batch
    duplicateCount += castsData.length - createCastsResult.count;
    if (duplicateCount > 20) {
      console.log("Duplicate limit reached. Stopping process.");
      hasNext = false;
    }

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

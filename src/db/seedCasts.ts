import { Prisma, PrismaClient } from "@prisma/client";
import { extractContractAddress, isDeployEvent } from "../lib/clanker";
import neynar from "../lib/neynar";

export async function seedCasts(prisma: PrismaClient) {
  const clanker = await prisma.user.findFirstOrThrow({
    where: { username: "clanker" },
  });

  let cursor: string | undefined;
  let hasNext = true;

  const parentUsers: Prisma.UserCreateManyInput[] = [];
  const tokens: Prisma.TokenCreateManyInput[] = [];
  const castsData: Prisma.CastCreateManyInput[] = [];

  const usersToInsert: Prisma.UserUpdateManyMutationInput[] = [];
  const walletsToInsert: Prisma.WalletCreateManyInput[] = [];

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

    const parentAuthorFids = casts.map((cast) => cast.parent_author.fid);
    const neynarUsers = await neynar.fetchBulkUsers({ fids: parentAuthorFids });
    const neynarUserMap = new Map(
      neynarUsers.users.map((user) => [user.fid, user])
    );

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

      const parentAuthor = neynarUserMap.get(cast.parent_author.fid);
      if (parentAuthor) {
        parentUsers.push({
          fid: cast.parent_author.fid,
          username: parentAuthor.username,
          followers: parentAuthor.follower_count,
          following: parentAuthor.following_count,
          neynarScore: parentAuthor.experimental?.neynar_user_score,
        });
        for (const address of parentAuthor.verified_addresses.eth_addresses) {
          walletsToInsert.push({
            fid: cast.parent_author.fid,
            address,
          });
        }
      } else {
        usersToInsert.push({ fid: cast.parent_author.fid });
      }

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

    // Create wallets
    await prisma.wallet.createMany({
      data: walletsToInsert,
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
    console.log(`Created ${createCastsResult.count} casts`);

    cursor = next.cursor || undefined;
    hasNext = !!next.cursor;

    // Calculate duplicates in this batch
    duplicateCount += castsData.length - createCastsResult.count;
    if (duplicateCount > 1) {
      console.log(
        `Duplicate limit reached [${duplicateCount}/${totalProcessedCount}]. Stopping process.`
      );
      hasNext = false;
    }

    // Reset arrays for next batch
    parentUsers.length = 0;
    tokens.length = 0;
    castsData.length = 0;
  }
}

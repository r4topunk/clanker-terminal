import alchemy from "../lib/alchemy";
import { processCast } from "../lib/clanker";
import neynar from "../lib/neynar";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const clanker = await prisma.user.findFirstOrThrow({
    where: { username: "clanker" },
  });

  let cursor: string | undefined;
  let hasNext = true;

  while (hasNext) {
    const { casts, next } = await neynar.fetchRepliesAndRecastsForUser({
      fid: clanker.fid,
      limit: 50,
      cursor,
    });

    console.log(`Fetched ${casts.length} casts from clanker.`);
    console.log("Next:", next);

    for (const cast of casts) {
      const dbCast = await prisma.cast.findUnique({
        where: { hash: cast.hash },
      });
      if (dbCast) {
        console.log("Cast already exists in database.");
        continue;
      }

      const { data, error } = await processCast(cast);
      if (error || !data) {
        console.error(`Error processing cast: ${error}`);
        continue;
      }

      const tokenData = await alchemy.core.getTokenMetadata(
        data.contractAddress
      );

      await prisma.cast.create({
        data: {
          hash: cast.hash,
          castDate: cast.timestamp,
          castMetrics: {
            create: {
              likes: cast.reactions.likes_count,
              recasts: cast.reactions.recasts_count,
              replies: cast.replies.count,
            },
          },
          user: { connect: { fid: clanker.fid } },
          token: {
            connectOrCreate: {
              where: { address: data.contractAddress },
              create: {
                address: data.contractAddress,
                name: tokenData.name,
                symbol: tokenData.symbol,
                logo: tokenData.logo,
                decimals: tokenData.decimals,
                chainId: 8453, // Base mainnet chain ID
                user: {
                  connectOrCreate: {
                    where: { fid: data.fid },
                    create: {
                      fid: data.fid,
                      username: data.username,
                      wallets: {
                        connectOrCreate: {
                          where: { address: data.walletAddress },
                          create: { address: data.walletAddress },
                        },
                      },
                      metrics: {
                        create: {
                          followers: data.deployerFollowers,
                          relevance: data.totalRelevancyScore,
                          following: data.deployerFollowing,
                          neynarScore: data.deployerNeynarScore,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      try {
        const parentCast = await neynar.lookupCastByHashOrWarpcastUrl({
          identifier: cast.parent_hash as string,
          type: "hash",
        });

        await prisma.cast.create({
          data: {
            hash: parentCast.cast.parent_hash as string,
            castDate: parentCast.cast.timestamp,
            castMetrics: {
              create: {
                likes: parentCast.cast.reactions.likes_count,
                recasts: parentCast.cast.reactions.recasts_count,
                replies: parentCast.cast.replies.count,
              },
            },
            fid: parentCast.cast.author.fid,
            tokenAddress: data.contractAddress,
          },
        });
      } catch (e) {
        console.error(`Error fetching parent cast for ${cast.hash}`);
        continue;
      }
    }

    cursor = next.cursor || undefined;
    hasNext = !!next.cursor;
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

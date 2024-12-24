import alchemy from "../lib/alchemy";
import { processCast } from "../lib/clanker";
import neynar from "../lib/neynar";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clanker = await prisma.user.findFirstOrThrow({
    where: { username: "clanker" },
  });

  const { casts, next } = await neynar.fetchRepliesAndRecastsForUser({
    fid: clanker.fid,
    limit: 15,
  });

  console.log(`Fetched ${casts.length} casts from clanker.`);
  console.log("Next:", next);

  for (const cast of casts) {
    const { data, error } = await processCast(cast);
    if (error || !data) {
      console.error(`Error processing cast: ${error}`);
      continue;
    }

    const tokenData = await alchemy.core.getTokenMetadata(data.contractAddress);

    const dbCast = await prisma.cast.findUnique({ where: { hash: cast.hash } });
    if (dbCast) {
      console.log("Cast already exists in database.");
      continue;
    }

    console.log(data);
    console.log(tokenData);
    console.log(cast);

    const res = await prisma.cast.create({
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
              user: { connect: { fid: cast.parent_author.fid } },
            },
          },
        },
      },
    });

    console.log(res);

    break;
  }

  // console.log(casts);

  console.log("Seeding database...");
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
import { PrismaClient } from "@prisma/client";
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
        console.error("Cast is not a deploy event.");
      }

      const contractAddress = extractContractAddress(cast.text);
      if (!contractAddress) {
        console.error("No contract address found in cast.");
        continue;
      }

      console.log(`Saving cast ${cast.hash}...`);

      await prisma.cast.create({
        data: {
          hash: cast.hash,
          user: { connect: { fid: clanker.fid } },
          parent_user: {
            connectOrCreate: {
              where: { fid: cast.parent_author.fid },
              create: { fid: cast.parent_author.fid },
            },
          },
          parent_hash: cast.parent_hash,
          castDate: cast.timestamp,
          token: {
            connectOrCreate: {
              where: { address: contractAddress },
              create: {
                address: contractAddress,
                chainId: 8453,
                user: {
                  connectOrCreate: {
                    where: { fid: cast.parent_author.fid },
                    create: { fid: cast.parent_author.fid },
                  },
                },
              },
            },
          },
        },
      });
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

import { getUserRelevancyScore } from "../lib/clanker";
import neynar from "../lib/neynar";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const { user } = await neynar.lookupUserByUsername({
    username: "willywonka.eth",
  });
  const totalRelevancyScore = await getUserRelevancyScore(user.fid);

  console.log(user);

  console.log("Seeding database...");

  await prisma.user.upsert({
    where: {
      fid: user.fid,
    },
    update: {
      username: user.username,
      wallets: {
        create: {
          address: user.verified_addresses.eth_addresses[0],
        },
      },
      metrics: {
        create: {
          followers: user.follower_count,
          following: user.following_count,
          relevance: totalRelevancyScore,
        },
      },
    },
    create: {
      fid: user.fid,
      username: user.username,
      wallets: {
        create: {
          address: user.verified_addresses.eth_addresses[0].toLocaleLowerCase(),
        },
      },
      metrics: {
        create: {
          followers: user.follower_count,
          following: user.following_count,
          relevance: totalRelevancyScore,
        },
      },
    },
  });
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

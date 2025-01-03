import { PrismaClient } from "@prisma/client";
import alchemy from "../lib/alchemy";
import { TokenMetadataResponse } from "alchemy-sdk";
import { seedCasts } from "./seedCasts";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  await seedCasts(prisma);
  await seedTokens();
}

// Add utility functions for batch processing
const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * @param {string[]} urls
 * @param {number} delayInterval
 * @param {number} batchSize
 */
const fetchInBatches = async (
  urls: string[],
  delayInterval: number,
  batchSize: number
) => {
  const remaining = [...urls];

  const responses: TokenMetadataResponse[] = [];

  while (remaining.length !== 0) {
    const batch = remaining.splice(0, batchSize);

    console.log(
      `Fetching batch of ${responses.length + batchSize}/${urls.length} tokens`
    );
    const [batchResponses] = await Promise.all([
      Promise.all(batch.map((url) => alchemy.core.getTokenMetadata(url))),
      sleep(delayInterval),
    ]);

    responses.push(...batchResponses);
  }

  return responses;
};

async function seedTokens() {
  // Array to store not found tokens
  const notFoundTokens: string[] = [];

  const pageSize = 30;
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const tokens = await prisma.token.findMany({
      where: { name: null },
      orderBy: { rowCreatedAt: "asc" },
      skip,
      take: pageSize,
    });

    if (tokens.length === 0) {
      hasMore = false;
      break;
    }

    const tokenAddresses = tokens.map((token) => token.address);
    const tokenInfos = await fetchInBatches(tokenAddresses, 1000, 5);

    await prisma.$transaction(
      async (tx) => {
        for (let i = 0; i < tokenAddresses.length; i++) {
          const address = tokenAddresses[i];
          const tokenInfo = tokenInfos[i];

          if (!tokenInfo) {
            console.log(`Token ${address} not found in Alchemy`);
            notFoundTokens.push(address);
            continue;
          }

          await tx.token.update({
            where: { address },
            data: {
              name: tokenInfo.name || address,
              symbol: tokenInfo.symbol,
              decimals: tokenInfo.decimals,
              logo: tokenInfo.logo,
            },
          });
          console.log(`Token ${address} updated successfully.`);
        }
      },
      { timeout: 30000 }
    );

    skip += notFoundTokens.length;
  }

  // Optionally handle notFoundTokens (e.g., log or store them)
}

main()
  .then(() => console.log("Database seeded successfully!"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // await prisma.$disconnect();
  });

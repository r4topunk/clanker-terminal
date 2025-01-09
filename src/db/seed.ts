import { PrismaClient } from "@prisma/client";
import { TokenMetadataResponse } from "alchemy-sdk";
import { base } from "viem/chains";
import alchemy from "../lib/alchemy";
import { isAddressEqualTo } from "../lib/ethereum";
import { fetchClankerTokens } from "../scripts/sync_clanker_db";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  // await seedCasts(prisma);
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

const CREATED_COLOR = "\x1b[32m"; // Green
const UPDATED_COLOR = "\x1b[34m"; // Blue
const RESET_COLOR = "\x1b[0m";

async function seedTokens() {
  const PAGE_AGGREGATION = 3;
  let page = 597;
  let hasMore = true;

  while (hasMore) {
    console.log(`Fetching page ${page}...`);
    const pages = Array.from({ length: PAGE_AGGREGATION }, (_, i) => page + i);

    const fetchPromises = pages.map((pageNum) =>
      fetchClankerTokens(pageNum, "asc")
    );
    const responses = await Promise.all(fetchPromises);

    const tokens = responses.flatMap((response) => response.data);
    const dbTokens = await prisma.token.findMany({
      where: {
        address: {
          in: tokens.map((token) => token.contract_address),
          mode: "insensitive",
        },
      },
    });

    const existingAddresses = dbTokens.map((token) =>
      token.address.toLowerCase()
    );
    const newTokens = tokens.filter(
      (token) =>
        !existingAddresses.includes(token.contract_address.toLowerCase())
    );
    const tokensToUpdate = tokens.filter((token) =>
      existingAddresses.includes(token.contract_address.toLowerCase())
    );

    // Create new tokens using createMany
    if (newTokens.length > 0) {
      await prisma.token.createMany({
        data: newTokens.map((token) => ({
          address: token.contract_address,
          name: token.name,
          symbol: token.symbol,
          logo: token.img_url,
          createdAt: new Date(token.created_at),
          txHash: token.tx_hash,
          poolAddress: token.pool_address,
          type: token.type,
          pair: token.pair,
          chainId: base.id,
        })),
        skipDuplicates: true,
      });

      console.log(
        `${CREATED_COLOR}Created ${newTokens.length} new tokens.${RESET_COLOR}`
      );
    }

    // Update existing tokens within a transaction
    if (tokensToUpdate.length > 0) {
      let success = false;
      while (!success) {
        try {
          await prisma.$transaction(
            async (tx) => {
              for (const token of tokensToUpdate) {
                await tx.token.update({
                  where: { address: token.contract_address },
                  data: {
                    name: token.name,
                    symbol: token.symbol,
                    logo: token.img_url,
                    createdAt: new Date(token.created_at),
                    txHash: token.tx_hash,
                    poolAddress: token.pool_address,
                    type: token.type,
                    pair: token.pair,
                  },
                });

                console.log(
                  `${UPDATED_COLOR}Token ${token.contract_address} updated successfully.${RESET_COLOR}`
                );
              }
            },
            { timeout: 30000 }
          );
          success = true;
        } catch (error) {
          console.error(
            `Transaction failed for updating tokens on page ${page}. Retrying...`,
            error
          );
        }
      }
    }

    hasMore = responses.some((response) => response.hasMore);
    page += PAGE_AGGREGATION;
  }
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

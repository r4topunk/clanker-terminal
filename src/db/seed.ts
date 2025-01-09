import { PrismaClient } from "@prisma/client";
import alchemy from "../lib/alchemy";
import { TokenMetadataResponse } from "alchemy-sdk";
import { seedCasts } from "./seedCasts";
import { fetchClankerTokens } from "../scripts/sync_clanker_db";
import { equal } from "node:assert";
import { base } from "viem/chains";

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

async function seedTokens() {
  const PAGE_AGGREGATION = 10;
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    console.log(`Fetching page ${page}...`);
    const pages = Array.from({ length: PAGE_AGGREGATION }, (_, i) => page + i);

    const fetchPromises = pages.map((pageNum) =>
      fetchClankerTokens(pageNum, "desc")
    );
    const responses = await Promise.all(fetchPromises);

    const tokens = responses.flatMap((response) => response.data);

    hasMore = responses.some((response) => response.hasMore);
    page += PAGE_AGGREGATION;

    await prisma.$transaction(
      async (tx) => {
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];

          const dbTokens = await tx.token.findMany({
            where: {
              address: {
                equals: token.contract_address,
                mode: "insensitive",
              },
            },
          });

          if (!dbTokens.length) {
            const dataToInsert = {
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
            };

            if (token.requestor_fid) {
              // await tx.token.create({
              //   data: {
              //     ...dataToInsert,
              //     user: {
              //       connectOrCreate: {
              //         where: { fid: token.requestor_fid || undefined },
              //         create: { fid: token.requestor_fid },
              //       },
              //     },
              //   },
              // });
            } else {
              // await tx.token.create({
              //   data: dataToInsert,
              // });
            }

            console.log(
              `Token ${token.contract_address} created successfully.`
            );
            continue;
          }

          // await tx.token.update({
          //   where: { address: dbTokens[0].address },
          //   data: {
          //     name: token.name,
          //     symbol: token.symbol,
          //     logo: token.img_url,
          //     createdAt: new Date(token.created_at),
          //     txHash: token.tx_hash,
          //     poolAddress: token.pool_address,
          //     type: token.type,
          //     pair: token.pair,
          //   },
          // });

          console.log(`Token ${token.contract_address} updated successfully.`);
        }
      },
      { timeout: 30000 }
    );
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

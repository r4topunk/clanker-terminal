import { PrismaClient } from "@prisma/client";
import { base } from "viem/chains";
import { isAddressEqualTo } from "../lib/ethereum";
import { fetchMultiTokenInfo } from "../lib/gecko";
import neynar from "../lib/neynar";
import { fetchClankerTokens } from "../scripts/sync_clanker_db";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  // await prisma.token.deleteMany({});
  // await prisma.user.deleteMany({});

  // await seedCasts(prisma);
  await seedTokens();
}

const CREATED_COLOR = "\x1b[32m"; // Green
const RESET_COLOR = "\x1b[0m";

async function seedTokens() {
  const PAGE_AGGREGATION = 1;
  let page = 3742;
  let hasMore = true;
  let sort: "asc" | "desc" = "asc";

  while (hasMore) {
    console.log(`[${new Date().toLocaleString()}] Fetching page ${page}...`);
    const pages = Array.from({ length: PAGE_AGGREGATION }, (_, i) => page + i);

    const fetchPromises = pages.map((pageNum) =>
      fetchClankerTokens(pageNum, sort)
    );
    const responses = await Promise.all(fetchPromises);

    const tokens = responses.flatMap((response) => response.data);
    if (tokens.length === 0) {
      throw new Error(`No tokens found on page ${page}`);
    }

    const tokenAddresses = tokens.map((token) => token.contract_address);

    const [tokensInfo, userData] = await Promise.all([
      fetchMultiTokenInfo(tokenAddresses),
      neynar.fetchBulkUsers({
        fids: tokens
          .map((token) => token.requestor_fid)
          .filter((fid) => fid !== 0 && fid !== null) as number[],
      }),
    ]);

    if (userData.users.length) {
      await prisma.user.createMany({
        data: userData.users.map((user) => ({
          fid: user.fid,
          username: user.username,
          pfpUrl: user.pfp_url,
          followers: user.follower_count,
          following: user.following_count,
          neynarScore: user.experimental?.neynar_user_score,
        })),
        skipDuplicates: true,
      });
      console.log(
        `${CREATED_COLOR}Created ${userData.users.length} users${RESET_COLOR}`
      );

      const userWallets = [];
      for (const user of userData.users) {
        for (const wallet of user.verified_addresses.eth_addresses) {
          userWallets.push({
            fid: user.fid,
            address: wallet,
          });
        }
      }

      await prisma.wallet.createMany({
        data: userWallets,
        skipDuplicates: true,
      });
      console.log(
        `${CREATED_COLOR}Created ${userWallets.length} wallets${RESET_COLOR}`
      );
    }

    await prisma.token.createMany({
      data: tokens.map((token) => ({
        address: token.contract_address,
        name: token.name,
        symbol: token.symbol,
        logo: token.img_url,
        txHash: token.tx_hash,
        poolAddress: token.pool_address,
        type: token.type,
        pair: token.pair,
        chainId: base.id,
        userFid: token.requestor_fid,
        createdAt: token.created_at,
      })),
      skipDuplicates: true,
    });
    console.log(
      `${CREATED_COLOR}Created ${tokens.length} tokens${RESET_COLOR}`
    );

    await prisma.tokenPrice.createMany({
      data: tokens.map((token) => {
        const tokenInfo = tokensInfo.find((info) =>
          isAddressEqualTo(info.address, token.contract_address)
        );

        return {
          address: token.contract_address,
          totalSupply: tokenInfo?.total_supply || undefined,
          fdvUsd: tokenInfo?.fdv_usd
            ? parseFloat(tokenInfo.fdv_usd)
            : undefined,
          priceUsd: tokenInfo?.price_usd
            ? parseFloat(tokenInfo.price_usd)
            : undefined,
          volumeUsdH24: tokenInfo?.volume_usd.h24
            ? parseFloat(tokenInfo.volume_usd.h24)
            : undefined,
          marketCapUsd: tokenInfo?.market_cap_usd
            ? parseFloat(tokenInfo.market_cap_usd)
            : undefined,
          totalReserveInUsd: tokenInfo?.total_reserve_in_usd
            ? parseFloat(tokenInfo.total_reserve_in_usd)
            : undefined,
        };
      }),
    });
    console.log(
      `${CREATED_COLOR}Created ${tokens.length} token prices${RESET_COLOR}`
    );

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
    await prisma.$disconnect();
  });

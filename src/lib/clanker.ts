import { fetchMultiTokenInfo } from "./gecko";
import { Cast } from "@neynar/nodejs-sdk/build/api";
import { Address, isAddressEqual } from "viem";
import neynar from "../lib/neynar";
import prisma from "./prisma";

export function isDeployEvent(cast: Cast): boolean {
  return (
    cast.author.username === "clanker" &&
    cast.text.includes("clanker.world") &&
    cast.parent_hash !== null
  );
}

export function extractContractAddress(castText: string): string | null {
  const contractAddressMatch = castText.match(/0x[a-fA-F0-9]{40}/);
  return contractAddressMatch ? contractAddressMatch[0] : null;
}

async function fetchDeployerInfo(fid: number) {
  const userResponse = await neynar.fetchBulkUsers({ fids: [fid] });
  return userResponse.users.length ? userResponse.users[0] : null;
}

async function fetchRelevancyData(deployerFid: number) {
  return await neynar.fetchRelevantFollowers({
    targetFid: deployerFid,
    viewerFid: 196328,
  });
}

export async function getUserRelevancyScore(fid: number) {
  const deployerRelevancyData = await fetchRelevancyData(fid);
  return deployerRelevancyData.top_relevant_followers_hydrated.reduce(
    (sum, follower) => sum + (follower.user?.follower_count || 0),
    0
  );
}

export async function getUserLastClankerMentions(fid: number) {
  const { casts } = await neynar.fetchCastsForUser({ fid, limit: 150 });
  if (!casts.length) {
    return [];
  }

  return casts
    .map((cast) => {
      if (
        cast.mentioned_profiles.some(
          (profile) => profile.username === "clanker"
        )
      ) {
        return {
          likes: cast.reactions.likes_count,
          recasts: cast.reactions.recasts_count,
          replies: cast.replies.count,
        };
      }
    })
    .filter((item) => item !== undefined);
}

export async function processCast(cast: Cast) {
  if (!isDeployEvent(cast)) {
    return { error: "Not a deploy event" };
  }

  const contractAddress = extractContractAddress(cast.text);
  if (!contractAddress) {
    return { error: "No contract address found" };
  }

  const deployerInfo = await fetchDeployerInfo(cast.parent_author.fid);
  if (!deployerInfo) {
    return { error: "Deployer not found" };
  }

  const deployerWalletAddress =
    deployerInfo.verified_addresses.eth_addresses[0];
  if (!deployerWalletAddress) {
    return { error: "No wallet address found" };
  }

  const deployerNeynarScore = deployerInfo.experimental?.neynar_user_score || 0;
  const deployerFollowers = deployerInfo.follower_count;
  const deployerFollowing = deployerInfo.following_count;

  const totalRelevancyScore = await getUserRelevancyScore(deployerInfo.fid);

  return {
    data: {
      // deployerInfo,
      fid: deployerInfo.fid,
      username: deployerInfo.username,
      walletAddress: deployerWalletAddress,
      contractAddress,
      deployerNeynarScore,
      deployerFollowers,
      deployerFollowing,
      totalRelevancyScore,
    },
    error: null,
  };
}

export async function castToDiscordMessage(cast: Cast): Promise<string> {
  if (!isDeployEvent(cast)) {
    throw new Error("Not a deploy event");
  }

  const contractAddress = extractContractAddress(cast.text);
  if (!contractAddress) {
    throw new Error("No contract address found");
  }

  const deployerInfo = await fetchDeployerInfo(cast.parent_author.fid);
  if (!deployerInfo) {
    throw new Error("Deployer not found");
  }

  const deployerNeynarScore = deployerInfo.experimental?.neynar_user_score || 0;
  const deployerFollowers = deployerInfo.follower_count;
  const deployerFollowing = deployerInfo.following_count;

  const totalRelevancyScore = await getUserRelevancyScore(deployerInfo.fid);

  // const tokenInfo = await alchemy.core.getTokenMetadata(contractAddress);

  await prisma.user.upsert({
    where: { fid: deployerInfo.fid },
    update: {
      neynarScore: deployerNeynarScore,
      followers: deployerFollowers,
      following: deployerFollowing,
    },
    create: {
      fid: deployerInfo.fid,
      username: deployerInfo.username,
      neynarScore: deployerNeynarScore,
      followers: deployerFollowers,
      following: deployerFollowing,
    },
  });

  await prisma.token.create({
    data: {
      address: contractAddress,
      // name: tokenInfo.name,
      // symbol: tokenInfo.symbol,
      chainId: 8453,
      userFid: deployerInfo.fid,
    },
  });

  await prisma.cast.create({
    data: {
      hash: cast.hash,
      fid: deployerInfo.fid,
      parent_hash: cast.parent_hash,
      castDate: cast.timestamp,
      tokenAddress: contractAddress,
      parent_fid: cast.parent_author.fid,
    },
  });

  const discordMessage = [
    "~~                        ~~",
    `### ${new Date(cast.timestamp).toLocaleString()}`,
    `- [${deployerInfo.username}](<https://warpcast.com/${deployerInfo.username}>)`,
    `- followers: ${deployerFollowers}`,
    `- relevancy: ${totalRelevancyScore}`,
    `- neynar score: ${deployerNeynarScore}`,
    `[clankerworld](<https://clanker.world/clanker/${contractAddress}>) - [warpcast](<https://warpcast.com/${cast.author.username}/${cast.hash}>)`,
    `\`\`\`${cast.text.split("\n")[0]}\`\`\``,
  ].join("\n");

  return discordMessage;
}

type Order = "asc" | "desc";
const PAGE_AGGREGATION = 8;

interface ClankerToken {
  id: number;
  created_at: string;
  tx_hash: string;
  contract_address: string;
  requestor_fid: number | null;
  name: string;
  symbol: string;
  img_url: string;
  pool_address: string;
  cast_hash: string | null;
  type: "clanker_v2" | null;
  pair: string | null;
}

interface ClankerResponse {
  data: ClankerToken[];
  hasMore: boolean;
  total: number;
}

export async function getClankerTokens(page: number = 1, sort: Order = "desc") {
  const pages = Array.from(
    { length: PAGE_AGGREGATION },
    (_, i) => (page - 1) * PAGE_AGGREGATION + (i + 1)
  );

  const fetchPromises = pages.map((page) =>
    fetch(
      `https://www.clanker.world/api/tokens?sort=${sort}&page=${page}&type=all`,
      {
        cache: "no-cache",
      }
    )
  );

  const responses = await Promise.all(fetchPromises);

  if (responses.some((response) => !response.ok)) {
    throw new Error("Failed to fetch data");
  }

  const dataList: ClankerResponse[] = await Promise.all(
    responses.map((response) => response.json())
  );

  const combinedData: ClankerResponse = {
    data: dataList.flatMap((data) => data.data),
    hasMore: dataList.some((data) => data.hasMore),
    total: dataList.reduce((acc, data) => acc + data.total, 0),
  };

  const tokenUsers = combinedData.data
    .map((token) => token.requestor_fid)
    .filter((fid) => fid !== 0 && fid !== null);
  const tokenAddresses = combinedData.data.map(
    (token) => token.contract_address
  );

  const userData = await neynar.fetchBulkUsers({
    fids: tokenUsers as number[],
  });
  const tokenData = await fetchMultiTokenInfo(tokenAddresses);

  const tokens = combinedData.data
    .map((token) => {
      const user = userData.users.find(
        (user) => user.fid === token.requestor_fid
      );
      const tokenInfo = tokenData.find((t) =>
        isAddressEqual(t.address as Address, token.contract_address as Address)
      );

      return {
        name: token.name,
        address: token.contract_address as Address,
        symbol: token.symbol,
        imageUrl: token.img_url,
        deployer: {
          username: user?.username || "Unknown",
          avatarUrl: user?.pfp_url || "",
          followers: user?.follower_count || 0,
          score: user?.experimental?.neynar_user_score || 0,
        },
        deployedAt: token.created_at,
        marketCap: parseFloat(
          tokenInfo?.market_cap_usd || tokenInfo?.fdv_usd || "0"
        ),
        volumeLastHour: parseFloat(tokenInfo?.volume_usd.h24 || "0"),
        priceChange: parseFloat(
          tokenInfo?.top_pool?.price_change_percentage.h24 || "0"
        ),
      };
    })
    .filter((token) => token !== null);

  return tokens;
}

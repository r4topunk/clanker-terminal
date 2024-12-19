import neynar from "@/lib/neynar";
import { Cast } from "@neynar/nodejs-sdk/build/api";

export function isDeployEvent(cast: Cast): boolean {
  return (
    cast.author.username === "clanker" && cast.text.includes("clanker.world")
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

async function getUserRelevancyScore(fid: number) {
  const deployerRelevancyData = await fetchRelevancyData(fid);
  return deployerRelevancyData.top_relevant_followers_hydrated.reduce(
    (sum, follower) => sum + (follower.user?.follower_count || 0),
    0
  );
}

async function getUserLastClankerMentions(fid: number) {
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

export interface DeploymentData {
  timestamp: string;
  username: string;
  followers: number;
  // relevancyScore: number;
  neynarScore: number;
  // clankerInteractions: {
  //   relevancy: number;
  //   quantity: number;
  // };
  contractAddress: string;
  castHash: string;
  // castAuthor: string;
  // castText: string;
}

export async function processCast(cast: Cast): Promise<DeploymentData> {
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

  if (deployerNeynarScore < 0.6 || deployerFollowers < 100) {
    throw new Error("Deployer does not meet requirements");
  }

  // const lastMentions = await getUserLastClankerMentions(deployerInfo.fid);
  // const clankerInteractionsRelevancy = lastMentions.reduce((sum, mention) => {
  //   if (mention) {
  //     return sum + mention.likes + mention.recasts + mention.replies;
  //   }
  //   return sum;
  // }, 0);

  // const totalRelevancyScore = await getUserRelevancyScore(deployerInfo.fid);

  return {
    timestamp: cast.timestamp,
    username: deployerInfo.username,
    followers: deployerFollowers,
    // relevancyScore: totalRelevancyScore,
    neynarScore: deployerNeynarScore,
    // clankerInteractions: {
    //   relevancy: clankerInteractionsRelevancy,
    //   quantity: lastMentions.length,
    // },
    contractAddress,
    castHash: cast.hash,
    // castAuthor: cast.author.username,
    // castText: cast.text.split("\n")[0],
  };
}

export function formatDiscordMessage(data: DeploymentData): string {
  return [
    "~~                        ~~",
    `### ${data.timestamp}`,
    `- [${data.username}](<https://warpcast.com/${data.username}>)`,
    `- followers: ${data.followers}`,
    `- relevancy: ${data.relevancyScore}`,
    `- neynar score: ${data.neynarScore}`,
    `**clanker interactions**`,
    `- relevancy: ${data.clankerInteractions.relevancy}`,
    `- quantity: ${data.clankerInteractions.quantity}`,
    `[clankerworld](<https://clanker.world/clanker/${data.contractAddress}>) - [warpcast](<https://warpcast.com/${data.castAuthor}/${data.castHash}>)`,
    `\`\`\`${data.castText}\`\`\``,
  ].join("\n");
}

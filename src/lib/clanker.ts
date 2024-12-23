import neynar from "../lib/neynar";
import { Cast } from "@neynar/nodejs-sdk/build/api";

function isDeployEvent(cast: Cast): boolean {
  return (
    cast.author.username === "clanker" && cast.text.includes("clanker.world")
  );
}

function extractContractAddress(castText: string): string | null {
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

export async function processCast(cast: Cast): Promise<string> {
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

  const lastMentions = await getUserLastClankerMentions(deployerInfo.fid);
  const clankerInteractionsRelevancy = lastMentions.reduce((sum, mention) => {
    if (mention) {
      return sum + mention.likes + mention.recasts + mention.replies;
    }
    return sum;
  }, 0);

  const totalRelevancyScore = await getUserRelevancyScore(deployerInfo.fid);

  console.log(lastMentions);

  const discordMessage = [
    "~~                        ~~",
    `### ${new Date(cast.timestamp).toLocaleString()}`,
    `- [${deployerInfo.username}](<https://warpcast.com/${deployerInfo.username}>)`,
    `- followers: ${deployerFollowers}`,
    `- relevancy: ${totalRelevancyScore}`,
    `- neynar score: ${deployerNeynarScore}`,
    `**clanker interactions**`,
    `- relevancy: ${clankerInteractionsRelevancy}`,
    `- quantity: ${lastMentions.length}`,
    `[clankerworld](<https://clanker.world/clanker/${contractAddress}>) - [warpcast](<https://warpcast.com/${cast.author.username}/${cast.hash}>)`,
    `\`\`\`${cast.text.split("\n")[0]}\`\`\``,
  ].join("\n");

  return discordMessage;
}

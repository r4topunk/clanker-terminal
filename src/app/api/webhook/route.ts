import discord from "@/lib/discord";
import { envs } from "@/lib/env";
import neynar from "@/lib/neynar";
import { Cast } from "@neynar/nodejs-sdk/build/api";
import { Routes } from "discord-api-types/v10";

export const dynamic = "force-dynamic";
const DISCORD_CHANNEL_ID = envs.DISCORD_CHANNEL_ID;

interface WebhookData {
  data: Cast;
}

function handleBadResponse(
  status: number,
  statusText: string,
  error: object | unknown = null
): Response {
  if (error) {
    console.error(statusText, error);
  }
  return new Response(null, {
    status,
    statusText,
  });
}

export async function POST(request: Request): Promise<Response> {
  let webhookData: WebhookData;
  try {
    webhookData = await request.json();
  } catch (error) {
    return handleBadResponse(400, "Invalid JSON", error);
  }

  if (!webhookData) {
    return handleBadResponse(400, "No webhook data provided");
  }

  const cast = webhookData.data;
  if (
    cast.author.username !== "clanker" ||
    !cast.text.includes("clanker.world")
  ) {
    return handleBadResponse(400, "Not a deploy event", cast);
  }

  const contractAddressMatch = cast.text.match(/0x[a-fA-F0-9]{40}/);
  if (!contractAddressMatch) {
    return handleBadResponse(400, "No contract address found");
  }
  const contractAddress = contractAddressMatch[0];

  let userResponse;
  try {
    userResponse = await neynar.fetchBulkUsers({
      fids: [cast.parent_author.fid],
    });
  } catch (error) {
    return handleBadResponse(500, "Failed to fetch user data", error);
  }

  if (!userResponse.users.length) {
    return handleBadResponse(400, "Deployer not found");
  }
  const deployerInfo = userResponse.users[0];
  let deployerRelevancyData;
  try {
    deployerRelevancyData = await neynar.fetchRelevantFollowers({
      targetFid: deployerInfo.fid,
      viewerFid: 196328,
    });
  } catch (error) {
    return handleBadResponse(500, "Failed to fetch relevancy data", error);
  }

  const deployerNeynarScore = deployerInfo.experimental?.neynar_user_score || 0;
  const deployerFollowers = deployerInfo.follower_count;

  if (deployerNeynarScore < 0.6 || deployerFollowers < 100) {
    return handleBadResponse(400, "Deployer does not meet requirements");
  }

  const totalRelevancyScore =
    deployerRelevancyData.top_relevant_followers_hydrated.reduce(
      (sum, follower) => sum + (follower.user?.follower_count || 0),
      0
    );

  const discordMessage = [
    "~~                        ~~",
    `new clank deployed to [${deployerInfo.username}](<https://warpcast.com/${deployerInfo.username}>)!`,
    `followers: ${deployerFollowers}`,
    `neynar score: ${deployerNeynarScore}`,
    `relevancy: ${totalRelevancyScore}`,
    `[clankerworld](<https://clanker.world/clanker/${contractAddress}>)`,
    `[warpcast](<https://warpcast.com/${cast.author.username}/${cast.hash}>)`,
    `\`\`\`${cast.text.split("\n")[0]}\`\`\``,
  ].join("\n");

  try {
    await discord.post(Routes.channelMessages(DISCORD_CHANNEL_ID), {
      body: {
        content: discordMessage,
      },
    });
  } catch (error) {
    return handleBadResponse(500, "Failed to send Discord message", error);
  }

  return Response.json({ success: true });
}

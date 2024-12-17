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

export async function POST(request: Request): Promise<Response> {
  const webhookData: WebhookData = await request.json();
  if (!webhookData) {
    return new Response(null, {
      status: 400,
      statusText: "No webhook data provided",
    });
  }

  const cast = webhookData.data;
  if (
    cast.author.username !== "clanker" ||
    !cast.text.includes("clanker.world")
  ) {
    console.error("Not a deploy event:", cast);
    return new Response(null, {
      status: 400,
      statusText: "Not a deploy event",
    });
  }

  const contractAddressMatch = cast.text.match(/0x[a-fA-F0-9]{40}/);
  if (!contractAddressMatch) {
    return new Response(null, {
      status: 400,
      statusText: "No contract address found",
    });
  }
  const contractAddress = contractAddressMatch[0];

  const userResponse = await neynar.fetchBulkUsers({
    fids: [cast.parent_author.fid],
  });
  if (!userResponse.users.length) {
    return new Response(null, {
      status: 400,
      statusText: "Deployer not found",
    });
  }
  const deployerInfo = userResponse.users[0];
  const deployerRelevancyData = await neynar.fetchRelevantFollowers({
    targetFid: deployerInfo.fid,
    viewerFid: 196328,
  });

  const deployerNeynarScore = deployerInfo.experimental?.neynar_user_score || 0;
  const deployerFollowers = deployerInfo.follower_count;

  if (deployerNeynarScore < 0.6 || deployerFollowers < 100) {
    return new Response(null, {
      status: 400,
      statusText: "Deployer does not meet requirements",
    });
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
    console.error("Failed to send Discord message:", error);
    return new Response(null, {
      status: 500,
      statusText: "Failed to send Discord message",
    });
  }

  return Response.json({ success: true });
}

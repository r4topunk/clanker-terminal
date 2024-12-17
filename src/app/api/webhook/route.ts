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
    return new Response(JSON.stringify({ error: "No webhook data provided" }), {
      status: 400,
    });
  }

  const cast = webhookData.data;
  if (!cast.text.includes("clanker.world")) {
    return new Response(JSON.stringify({ error: "Not a deploy event" }), {
      status: 400,
    });
  }

  const contractAddressMatch = cast.text.match(/0x[a-fA-F0-9]{40}/);
  if (!contractAddressMatch) {
    return new Response(
      JSON.stringify({ error: "No contract address found" }),
      {
        status: 400,
      }
    );
  }
  const contractAddress = contractAddressMatch[0];

  const userResponse = await neynar.fetchBulkUsers({
    fids: [cast.parent_author.fid],
  });
  if (!userResponse.users.length) {
    return new Response(JSON.stringify({ error: "Deployer not found" }), {
      status: 404,
    });
  }
  const deployerInfo = userResponse.users[0];
  const deployerRelevancyData = await neynar.fetchRelevantFollowers({
    targetFid: deployerInfo.fid,
    viewerFid: 196328,
  });

  const totalRelevancyScore =
    deployerRelevancyData.top_relevant_followers_hydrated.reduce(
      (sum, follower) => sum + (follower.user?.follower_count || 0),
      0
    );

  const discordMessage = [
    "~~                        ~~",
    `new clank deployed to [${deployerInfo.username}](<https://warpcast.com/${deployerInfo.username}>)!`,
    `followers: ${deployerInfo.follower_count}`,
    `score: ${deployerInfo.experimental?.neynar_user_score}`,
    `relevancy: ${totalRelevancyScore}`,
    `[clankerworld](<https://clanker.world/clanker/${contractAddress}>)`,
    `[warpcast](<https://warpcast.com/${cast.author.username}/${cast.hash}>)`,
    `\`\`\`${cast.text}\`\`\``,
  ].join("\n");

  try {
    await discord.post(Routes.channelMessages(DISCORD_CHANNEL_ID), {
      body: {
        content: discordMessage,
      },
    });
  } catch (error) {
    console.error("Failed to send Discord message:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send Discord message" }),
      {
        status: 500,
      }
    );
  }

  return Response.json({ success: true });
}

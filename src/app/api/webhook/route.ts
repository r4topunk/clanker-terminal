import discord from "@/lib/discord";
import { envs } from "@/lib/env";
import { Routes } from "discord-api-types/v10";
import { processCast } from "@/lib/clanker";

export const dynamic = "force-dynamic";
const DISCORD_CHANNEL_ID = envs.DISCORD_CHANNEL_ID;

function handleBadResponse(status: number, statusText: string): Response {
  console.error(statusText);
  return new Response(null, {
    status,
    statusText,
  });
}

export async function POST(request: Request) {
  let webhookData;
  try {
    webhookData = await request.json();
  } catch (error) {
    return handleBadResponse(400, "Invalid JSON");
  }

  if (!webhookData) {
    return handleBadResponse(400, "No webhook data provided");
  }

  try {
    const discordMessage = await processCast(webhookData.data);
    await discord.post(Routes.channelMessages(DISCORD_CHANNEL_ID), {
      body: {
        content: discordMessage,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An error occurred";
    return handleBadResponse(500, message);
  }

  return Response.json({ success: true });
}

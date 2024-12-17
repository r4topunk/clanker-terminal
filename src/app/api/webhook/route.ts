import { config } from "@/lib/env";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

export const dynamic = "force-dynamic";

const PROD_CHANNEL_ID = "1318413688465653881";
const DEV_CHANNEL_ID = "1318414177294880788";
const CHANNEL_ID = DEV_CHANNEL_ID;
// process.env.NODE_ENV === "production" ? PROD_CHANNEL_ID : DEV_CHANNEL_ID;

export async function POST() {
  const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

  try {
    await rest.post(Routes.channelMessages(CHANNEL_ID), {
      body: {
        content: "A message via REST!",
      },
    });
  } catch (error) {
    console.error(error);
  }

  return Response.json({ data: "Hello World" });
}

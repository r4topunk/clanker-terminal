import { envs } from "@/lib/env";
import neynar from "@/lib/neynar";
import { REST } from "@discordjs/rest";
import { Cast } from "@neynar/nodejs-sdk/build/api";
import { Routes } from "discord-api-types/v10";

export const dynamic = "force-dynamic";

// const PROD_CHANNEL_ID = "1318413688465653881";
const DEV_CHANNEL_ID = "1318414177294880788";
const CHANNEL_ID = DEV_CHANNEL_ID;
// process.env.NODE_ENV === "production" ? PROD_CHANNEL_ID : DEV_CHANNEL_ID;

export async function POST(request: Request): Promise<Response> {
  const hook = await request.json();
  if (!hook) {
    console.error("No data on webhook");
    return Response.json({ data: "No data" });
  }

  const cast: Cast = hook.data;

  if (!cast.text.includes("clanker.world")) {
    console.error("Not a deploy");
    return Response.json({ data: "Not a deploy" });
  }

  const contractAddressMatch = cast.text.match(/0x[a-fA-F0-9]{40}/);
  if (!contractAddressMatch) {
    console.error("No contract address found");
    return Response.json({ data: "No contract address found" });
  }
  const contractAddress = contractAddressMatch[0];

  const fetchBulkUsers = await neynar.fetchBulkUsers({
    fids: [cast.parent_author.fid],
  });
  if (!fetchBulkUsers.users.length) {
    console.error("No deployer");
    return Response.json({ data: "No deployer" });
  }
  const deployer = fetchBulkUsers.users[0];
  const deployerRelevancy = await neynar.fetchRelevantFollowers({
    targetFid: deployer.fid,
    viewerFid: 196328,
  });

  let relevancy = 0;
  deployerRelevancy.top_relevant_followers_hydrated.forEach((follower) => {
    relevancy += follower.user?.follower_count || 0;
  });

  let message = `~~                        ~~\n`;
  message += `new clank deployed to [${deployer.username}](<https://warpcast.com/${deployer.username}>)!\n`;
  message += `followers: ${deployer.follower_count}\n`;
  message += `score: ${deployer.experimental?.neynar_user_score}\n`;
  message += `relevancy: ${relevancy}\n`;
  message += `[clankerworld](<https://clanker.world/${contractAddress}>)\n`;
  message += `[warpcast](<https://warpcast.com/${cast.author.username}/${cast.hash}>)\n`;
  message += `\`\`\`${cast.text}\`\`\``;

  const rest = new REST({ version: "10" }).setToken(envs.DISCORD_TOKEN);
  try {
    await rest.post(Routes.channelMessages(CHANNEL_ID), {
      body: {
        content: message,
      },
    });
  } catch (error) {
    console.error(error);
  }

  return Response.json({ data: "Hello World" });
}

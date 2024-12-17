import { envs } from "@/lib/env";
import neynar from "@/lib/neynar";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

export const dynamic = "force-dynamic";

// const PROD_CHANNEL_ID = "1318413688465653881";
const DEV_CHANNEL_ID = "1318414177294880788";
const CHANNEL_ID = DEV_CHANNEL_ID;
// process.env.NODE_ENV === "production" ? PROD_CHANNEL_ID : DEV_CHANNEL_ID;

export async function POST(request: Request): Promise<Response> {
  const hook = (await request.json()) as WebhookRequest;
  if (!hook) {
    console.error("No data on webhook");
    return Response.json({ data: "No data" });
  }

  const cast = hook.data;

  // if (!cast.text.includes("clanker.world")) {
  //   console.error("Not a deploy");
  //   return Response.json({ data: "Not a deploy" });
  // }

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
  message += `[clankerworld](<https://clanker.world/${cast.hash}>)\n`;
  message += `[warpcast](<https://warpcast.com/${deployer.username}/${cast.hash}>)\n`;
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

export interface WebhookRequest {
  created_at: number;
  type: string;
  data: Data;
}

export interface Data {
  object: string;
  hash: string;
  author: Author;
  thread_hash: string;
  parent_hash: string;
  parent_url: any;
  root_parent_url: string;
  parent_author: ParentAuthor;
  text: string;
  timestamp: string;
  embeds: Embed[];
  channel: Channel;
  reactions: Reactions;
  replies: Replies;
  mentioned_profiles: MentionedProfile[];
  author_channel_context: AuthorChannelContext;
  event_timestamp: string;
}

export interface Author {
  object: string;
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  profile: Profile;
  follower_count: number;
  following_count: number;
  verifications: string[];
  verified_addresses: VerifiedAddresses;
  verified_accounts: any[];
  power_badge: boolean;
  experimental: Experimental;
}

export interface Profile {
  bio: Bio;
  location?: Location;
}

export interface Bio {
  text: string;
  mentioned_profiles?: any[];
}

export interface Location {
  latitude: number;
  longitude: number;
  address: Address;
}

export interface Address {
  city: string;
  country: string;
  country_code: string;
}

export interface VerifiedAddresses {
  eth_addresses: string[];
  sol_addresses: string[];
}

export interface Experimental {
  neynar_user_score: number;
}

export interface ParentAuthor {
  fid: number;
}

export interface Embed {
  cast_id?: CastId;
  cast?: Cast;
  url?: string;
  metadata?: Metadata;
}

export interface CastId {
  fid: number;
  hash: string;
}

export interface Cast {
  object: string;
  hash: string;
  author: Author;
  thread_hash: string;
  parent_hash: any;
  parent_url: string;
  root_parent_url: string;
  parent_author: ParentAuthor;
  text: string;
  timestamp: string;
  embeds: Embed[];
  channel: Channel;
}

export interface Metadata {
  content_type: string;
  content_length: any;
  _status: string;
  html: Html;
}

export interface Html {
  ogImage: OgImage[];
  ogTitle: string;
  ogLocale: string;
}

export interface OgImage {
  url: string;
}

export interface Channel {
  object: string;
  id: string;
  name: string;
  image_url: string;
}

export interface Reactions {
  likes_count: number;
  recasts_count: number;
  likes: any[];
  recasts: any[];
}

export interface Replies {
  count: number;
}

export interface MentionedProfile {
  object: string;
  fid: number;
  custody_address: string;
  username: string;
  display_name: string;
  pfp_url: string;
  profile: Profile;
  follower_count: number;
  following_count: number;
  verifications: string[];
  verified_addresses: VerifiedAddresses;
  power_badge: boolean;
}

export interface AuthorChannelContext {
  following: boolean;
}

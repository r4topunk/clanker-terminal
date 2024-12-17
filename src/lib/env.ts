const { DISCORD_TOKEN, DISCORD_CLIENT_ID, NEYNAR_API_KEY, DISCORD_CHANNEL_ID } =
  process.env;

if (
  !DISCORD_TOKEN ||
  !DISCORD_CLIENT_ID ||
  !NEYNAR_API_KEY ||
  !DISCORD_CHANNEL_ID
) {
  throw new Error("Missing environment variables");
}

export const envs = {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
  NEYNAR_API_KEY,
  DISCORD_CHANNEL_ID,
};

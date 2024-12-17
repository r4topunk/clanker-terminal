const { DISCORD_TOKEN, DISCORD_CLIENT_ID, NEYNAR_API_KEY } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !NEYNAR_API_KEY) {
  throw new Error("Missing environment variables");
}

export const envs = {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
  NEYNAR_API_KEY,
};

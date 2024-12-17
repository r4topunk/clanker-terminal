import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { envs } from "./env";

const config = new Configuration({
  apiKey: envs.NEYNAR_API_KEY,
});

const neynar = new NeynarAPIClient(config);
export default neynar;

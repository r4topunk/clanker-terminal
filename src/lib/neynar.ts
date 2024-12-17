import { Configuration, NeynarAPIClient } from "@neynar/nodejs-sdk";
import { envs } from "./env";

const config = new Configuration({
  apiKey: envs.NEYNAR_API_KEY,
  baseOptions: {
    headers: {
      "x-neynar-experimental": "true",
    },
  },
});

const neynar = new NeynarAPIClient(config);
export default neynar;

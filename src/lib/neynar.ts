import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { envs } from "./env";
import { headers } from "next/headers";

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

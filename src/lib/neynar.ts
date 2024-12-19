import { Configuration, NeynarAPIClient } from "@neynar/nodejs-sdk";
// import { envs } from "./env";

const config = new Configuration({
  apiKey: "7A73A217-952D-4FEF-8BF5-30B1FAFA1F08",
  baseOptions: {
    headers: {
      "x-neynar-experimental": "true",
    },
  },
});

const neynar = new NeynarAPIClient(config);
export default neynar;

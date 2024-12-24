import { Network, Alchemy } from "alchemy-sdk";
import { envs } from "./env";

const settings = {
  apiKey: envs.ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
};

const alchemy = new Alchemy(settings);

export default alchemy;

import { REST } from "@discordjs/rest";
import { envs } from "./env";

const discord = new REST({ version: "10" }).setToken(envs.DISCORD_TOKEN);
export default discord;

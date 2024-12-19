import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { abi } from "./abi";
import fs from "fs";
import { parse } from "json2csv";

const publicClient = createPublicClient({
  chain: base,
  transport: http(
    `https://base-mainnet.g.alchemy.com/v2/_OAOiBtV04wP6x1-gAqpwQoBj_ykKgv7`
  ),
});

const contractAddress = "0x732560fa1d1A76350b1A500155BA978031B53833";

(async () => {
  const logs = await publicClient.getContractEvents({
    address: contractAddress,
    abi,
    eventName: "TokenCreated",
    fromBlock: BigInt(23586651),
    toBlock: "latest",
  });

  const logArgs = logs.map((log) => log.args);
  const csvData = parse(logArgs);

  fs.writeFileSync("src/scripts/onchain-out2.csv", csvData, "utf8");
})();

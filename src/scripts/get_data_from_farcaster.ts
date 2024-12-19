import fs from "fs";
import { extractContractAddress } from "@/lib/clanker";
import neynar from "@/lib/neynar";
import { parse } from "json2csv"; // Add JSON to CSV conversion

(async () => {
  try {
    // Read the last cursor value from file
    let cursor;
    if (fs.existsSync("src/scripts/lastCursor.json")) {
      const data = fs.readFileSync("src/scripts/lastCursor.json", "utf8");
      cursor = JSON.parse(data).cursor;
    } else {
      cursor = undefined;
    }

    const fid = 874542; // clanker
    const allCasts = [];
    const uniqueCasts = new Set();

    while (cursor !== null) {
      console.log("Starting new batch with cursor:", cursor);
      const { casts, next } = await neynar.fetchCastsForUser({
        fid,
        limit: 150,
        includeReplies: true,
        cursor,
      });
      if (next.cursor) {
        next.cursor = decodeURIComponent(next.cursor);
      }

      for (const cast of casts) {
        try {
          console.log("Looking at:", cast.hash);
          const contractAddress = extractContractAddress(cast.text);
          if (!contractAddress) {
            continue;
          }

          if (!uniqueCasts.has(cast.hash)) {
            allCasts.push({
              timestamp: cast.timestamp,
              deployer_fid: cast.parent_author.fid,
              contractAddress,
              castHash: cast.hash,
            });
            uniqueCasts.add(cast.hash);
          }
          await new Promise((resolve) => setTimeout(resolve, 30));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "An error occurred";
          console.error("Error processing cast:", message);
        }
      }

      cursor = next.cursor || null;
      console.log("Next cursor:", cursor);
      if (allCasts.length === 0) {
        continue;
      }

      // Write the current cursor value to file
      fs.writeFileSync(
        "src/scripts/lastCursor.json",
        JSON.stringify({ cursor }),
        "utf8"
      );

      // Convert allCasts to CSV
      const csvData = parse(allCasts);

      fs.writeFileSync(
        "src/scripts/out.csv", // Change file extension to .csv
        csvData,
        "utf8"
      );
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
})();

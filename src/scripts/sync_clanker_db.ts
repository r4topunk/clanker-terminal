interface ClankerToken {
  id: number;
  created_at: string;
  tx_hash: string;
  contract_address: string;
  name: string;
  symbol: string;
  pool_address: string;
  requestor_fid: number | null;
  img_url: string | null;
  cast_hash: string | null;
  type: "clanker_v2" | null;
  pair: string | null;
}

interface ClankerTokensResponse {
  data: ClankerToken[];
  hasMore: boolean;
  total: number;
}

export async function fetchClankerTokens(
  page: number = 1,
  sort: "asc" | "desc" = "desc"
): Promise<ClankerTokensResponse> {
  try {
    const response = await fetch(
      `https://www.clanker.world/api/tokens?sort=${sort}&page=${page}&type=all`
    );

    if (!response.ok) {
      throw new Error(`Error fetching tokens: ${response.statusText}`);
    }

    const data: ClankerTokensResponse = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// async function main() {
//   let page = 1;
//   let hasMore = true;

//   while (hasMore) {
//     console.log(`Fetching page ${page}...`);
//     const pages = Array.from({ length: PAGE_AGGREGATION }, (_, i) => page + i);

//     const fetchPromises = pages.map((pageNum) =>
//       fetchClankerTokens(pageNum, "asc")
//     );
//     const responses = await Promise.all(fetchPromises);

//     const tokens = responses.flatMap((response) => response.data);
//     fs.appendFileSync("tokens.json", JSON.stringify(tokens, null, 2) + "\n");

//     hasMore = responses.some((response) => response.hasMore);
//     page += PAGE_AGGREGATION;
//   }

// console.log(tokens);
// }
// main();

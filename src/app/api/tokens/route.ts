import { fetchMultiTokenInfo } from "@/lib/gecko";
import neynar from "@/lib/neynar";
import { Address, isAddressEqual } from "viem";

interface ClankerToken {
  id: number;
  created_at: string;
  tx_hash: string;
  contract_address: string;
  requestor_fid: number | null;
  name: string;
  symbol: string;
  img_url: string;
  pool_address: string;
  cast_hash: string | null;
  type: "clanker_v2" | null;
  pair: string | null;
}

interface ClankerResponse {
  data: ClankerToken[];
  hasMore: boolean;
  total: number;
}

export const revalidate = 30;
const PAGE_AGGREGATION = 10;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const sort = "desc";

  const pages = Array.from(
    { length: PAGE_AGGREGATION },
    (_, i) => (page - 1) * PAGE_AGGREGATION + (i + 1)
  );

  const fetchPromises = pages.map((page) =>
    fetch(
      `https://www.clanker.world/api/tokens?sort=${sort}&page=${page}&type=all`,
      {
        cache: "no-cache",
      }
    )
  );

  const responses = await Promise.all(fetchPromises);

  if (responses.some((response) => !response.ok)) {
    return new Response("Failed to fetch tokens", {
      status: 500,
    });
  }

  const dataList: ClankerResponse[] = await Promise.all(
    responses.map((response) => response.json())
  );

  const combinedData: ClankerResponse = {
    data: dataList.flatMap((data) => data.data),
    hasMore: dataList.some((data) => data.hasMore),
    total: dataList.reduce((acc, data) => acc + data.total, 0),
  };

  const tokenUsers = combinedData.data
    .map((token) => token.requestor_fid)
    .filter((fid) => fid !== 0 && fid !== null);
  const tokenAddresses = combinedData.data.map(
    (token) => token.contract_address
  );

  const userData = await neynar.fetchBulkUsers({
    fids: tokenUsers as number[],
  });
  const tokenData = await fetchMultiTokenInfo(tokenAddresses);

  const tokens = combinedData.data
    .map((token) => {
      const user = userData.users.find(
        (user) => user.fid === token.requestor_fid
      );
      const tokenInfo = tokenData.find((t) =>
        isAddressEqual(t.address as Address, token.contract_address as Address)
      );

      return {
        name: token.name,
        address: token.contract_address as Address,
        symbol: token.symbol,
        imageUrl: token.img_url,
        deployer: {
          username: user?.username || "Unknown",
          avatarUrl: user?.pfp_url || "",
          followers: user?.follower_count || 0,
          score: user?.experimental?.neynar_user_score || 0,
        },
        deployedAt: token.created_at,
        marketCap: parseFloat(
          tokenInfo?.market_cap_usd || tokenInfo?.fdv_usd || "0"
        ),
        volumeLastHour: parseFloat(tokenInfo?.volume_usd.h24 || "0"),
        priceChange: parseFloat(
          tokenInfo?.top_pool?.price_change_percentage.h24 || "0"
        ),
      };
    })
    .filter((token) => token !== null);

  return new Response(JSON.stringify(tokens), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

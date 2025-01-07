import { fetchMultiTokenInfo } from "@/lib/gecko";
import neynar from "@/lib/neynar";
import { Address, isAddressEqual } from "viem";
import { Token, TokenCard } from "../molecules/tokenCard";

interface ClankerToken {
  id: number;
  created_at: string;
  tx_hash: string;
  contract_address: string;
  requestor_fid: number;
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

async function TokensGrid() {
  const sort = "asc";
  const currentPage = 1;
  const pages = [
    (currentPage - 1) * 3 + 1,
    (currentPage - 1) * 3 + 2,
    (currentPage - 1) * 3 + 3,
  ];

  const fetchPromises = pages.map((page) =>
    fetch(
      `https://www.clanker.world/api/tokens?sort=${sort}&page=${page}&type=all`
    )
  );

  const responses = await Promise.all(fetchPromises);

  if (responses.some((response) => !response.ok)) {
    throw new Error("Failed to fetch tokens");
  }

  const dataList: ClankerResponse[] = await Promise.all(
    responses.map((response) => response.json())
  );

  const combinedData: ClankerResponse = {
    data: dataList.flatMap((data) => data.data),
    hasMore: dataList.some((data) => data.hasMore),
    total: dataList.reduce((acc, data) => acc + data.total, 0),
  };

  const tokenUsers = combinedData.data.map((token) => token.requestor_fid);
  const tokenAddresses = combinedData.data.map(
    (token) => token.contract_address
  );

  const userData = await neynar.fetchBulkUsers({
    fids: tokenUsers,
  });
  const tokenData = await fetchMultiTokenInfo(tokenAddresses);

  console.log({
    userData: userData.users.length,
    tokenData: tokenData.length,
  });

  const tokens: Token[] = combinedData.data
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
      };
    })
    .filter((token) => token !== null);

  return tokens.map((token) => {
    return <TokenCard key={token.address} token={token} />;
  });
}

export default TokensGrid;

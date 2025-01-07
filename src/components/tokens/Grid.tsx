import { fetchMultiTokenInfo } from "@/lib/gecko";
import neynar from "@/lib/neynar";
import React from "react";
import { Token, TokenCard } from "../molecules/tokenCard";
import { Address, isAddressEqual } from "viem";

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
  const sort = "desc";
  const page = 1;
  const response = await fetch(
    `https://www.clanker.world/api/tokens?sort=${sort}&page=${page}&type=all`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch tokens");
  }

  const data: ClankerResponse = await response.json();

  const tokenUsers = data.data.map((token) => {
    return token.requestor_fid;
  });
  const tokenAddresses = data.data.map((token) => {
    return token.contract_address;
  });

  const userData = await neynar.fetchBulkUsers({
    fids: tokenUsers,
  });
  const tokenData = await fetchMultiTokenInfo(tokenAddresses);

  const tokens: Token[] = data.data
    .map((token) => {
      const user = userData.users.find(
        (user) => user.fid === token.requestor_fid
      );
      const tokenInfo = tokenData.find((t) =>
        isAddressEqual(t.address as Address, token.contract_address as Address)
      );
      console.log({ token, user, tokenInfo });
      if (!tokenInfo || !user) return null;

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

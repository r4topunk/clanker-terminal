export interface TokenAttribute {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  image_url: string;
  coingecko_coin_id: string | null;
  total_supply: string;
  price_usd: string | null;
  fdv_usd: string | null;
  total_reserve_in_usd: string | null;
  volume_usd: {
    h24: string | null;
  };
  market_cap_usd: string | null;
}

interface RelationshipData {
  id: string;
  type: string;
}

interface Relationships {
  top_pools: {
    data: RelationshipData[];
  };
}

interface GeckoTokenResponse {
  data: {
    id: string;
    type: string;
    attributes: TokenAttribute;
    relationships: Relationships;
  }[];
}

export async function fetchMultiTokenInfo(
  tokenAddresses: string[]
): Promise<GeckoTokenResponse> {
  const baseUrl = "https://api.geckoterminal.com/api/v2";
  const network = "base";

  try {
    const response = await fetch(
      `${baseUrl}/networks/${network}/tokens/multi/${tokenAddresses.join(",")}`,
      {
        headers: {
          accept: "application/json",
        },
      }
    );
    const data: GeckoTokenResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching token info:", error);
    throw error;
  }
}

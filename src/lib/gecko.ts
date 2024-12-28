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

export interface GeckoTokenResponse {
  data: {
    id: string;
    type: string;
    attributes: TokenAttribute;
    relationships: Relationships;
  }[];
}

// Add a helper function to split array into chunks
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function fetchMultiTokenInfo(
  tokenAddresses: string[]
): Promise<TokenAttribute[]> {
  const baseUrl = "https://api.geckoterminal.com/api/v2";
  const network = "base";
  const batchSize = 30;
  const aggregatedTokens: TokenAttribute[] = [];

  const batches = chunkArray(tokenAddresses, batchSize);

  try {
    for (const batch of batches) {
      const response = await fetch(
        `${baseUrl}/networks/${network}/tokens/multi/${batch.join(",")}`,
        {
          headers: {
            accept: "application/json",
          },
        }
      );
      const result: GeckoTokenResponse = await response.json();
      aggregatedTokens.push(...result.data.map((token) => token.attributes));
    }
    return aggregatedTokens;
  } catch (error) {
    console.error("Error fetching token info:", error);
    throw error;
  }
}

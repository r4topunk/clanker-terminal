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
  top_pool: PoolAttributes | null;
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

export interface PoolAttributes {
  base_token_price_usd: string;
  base_token_price_native_currency: string;
  quote_token_price_usd: string;
  quote_token_price_native_currency: string;
  base_token_price_quote_token: string;
  quote_token_price_base_token: string;
  address: string;
  name: string;
  pool_created_at: string;
  fdv_usd: string;
  market_cap_usd: string;
  price_change_percentage: {
    m5: string;
    h1: string;
    h6: string;
    h24: string;
  };
  transactions: {
    m5: TransactionData;
    m15: TransactionData;
    m30: TransactionData;
    h1: TransactionData;
    h24: TransactionData;
  };
  volume_usd: {
    m5: string;
    h1: string;
    h6: string;
    h24: string;
  };
  reserve_in_usd: string;
}

export interface TransactionData {
  buys: number;
  sells: number;
  buyers: number;
  sellers: number;
}

export interface PoolRelationships {
  base_token: RelationshipData;
  quote_token: RelationshipData;
  dex: RelationshipData;
}

export interface IncludedData {
  id: string;
  type: string;
  attributes: PoolAttributes;
  relationships: PoolRelationships;
}

export interface GeckoTokenResponse {
  data: {
    id: string;
    type: string;
    attributes: TokenAttribute;
    relationships: Relationships;
  }[];
  included?: IncludedData[];
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
        `${baseUrl}/networks/${network}/tokens/multi/${batch.join(
          ","
        )}?include=top_pools`,
        {
          headers: {
            accept: "application/json",
          },
        }
      );
      if (response.ok) {
        const result: GeckoTokenResponse = await response.json();
        const poolMap = new Map<string, PoolAttributes>();
        if (result.included) {
          for (const pool of result.included) {
            poolMap.set(pool.id, pool.attributes);
          }
        }

        aggregatedTokens.push(
          ...result.data.map((token) => ({
            ...token.attributes,
            top_pool: token.relationships.top_pools.data[0]
              ? poolMap.get(token.relationships.top_pools.data[0].id) || null
              : null,
          }))
        );
      }
    }
    return aggregatedTokens;
  } catch (error) {
    console.error("Error fetching token info:", error);
    throw error;
  }
}

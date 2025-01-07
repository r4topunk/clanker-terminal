"use client";

import { useEffect, useState } from "react";
import { Token, TokenCard } from "../molecules/tokenCard";

function TokensGrid({ page }: { page: number }) {
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    const fetchTokens = async () => {
      console.log("fetching tokens");
      const res = await fetch(`/api/tokens?page=${page}`);
      const data = await res.json();
      setTokens(data);
    };
    fetchTokens();
    const interval = setInterval(fetchTokens, 30000);
    return () => clearInterval(interval);
  }, [page]);

  return tokens.map((token) => <TokenCard key={token.address} token={token} />);
}

export default TokensGrid;

"use client";

import { useEffect, useState } from "react";
import { Token, TokenCard } from "../molecules/tokenCard";

function TokensGrid({
  page,
  defaultTokens = [],
}: {
  page: number;
  defaultTokens?: Token[];
}) {
  const [tokens, setTokens] = useState<Token[]>(defaultTokens);

  useEffect(() => {
    const fetchTokens = async () => {
      console.log("fetching tokens");
      const res = await fetch(`/api/tokens?page=${page}`);
      const data = await res.json();
      setTokens(data);
    };
    const interval = setInterval(fetchTokens, 30000);
    return () => clearInterval(interval);
  }, [page]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
      {tokens.map((token) => (
        <TokenCard key={token.address} token={token} />
      ))}
    </div>
  );
}

export default TokensGrid;

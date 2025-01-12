import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAddress } from "@/lib/ethereum";
import { fetchMultiTokenInfo } from "@/lib/gecko";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { Address, isAddressEqual, zeroAddress } from "viem";
import { buttonVariants } from "../ui/button";
import Pagination from "./Pagination";

interface TokensTableProps {
  neynarScore: number;
  page: number;
  take: number;
  user?: string;
}

const TokensTable: React.FC<TokensTableProps> = async ({
  neynarScore,
  page,
  take,
  user,
}) => {
  const skip = (page - 1) * take;

  const tokens = await prisma.token.findMany({
    include: {
      user: true,
      tokenPrices: {
        take: 1,
        orderBy: { rowCreatedAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    where: {
      user: { neynarScore: { gte: neynarScore }, username: user },
      tokenPrices: {
        some: {
          fdvUsd: {
            gt: 0,
          },
        },
      },
    },
    skip,
  });

  const totalTokens = await prisma.token.count({
    where: {
      user: { neynarScore: { gte: neynarScore }, username: user },
    },
  });
  const totalPages = Math.ceil(totalTokens / take);

  return (
    <>
      <div className="flex flex-col gap-4 mt-4 w-full max-w-full overflow-x-auto font-mono animate-in fade-in duration-300 animate-out">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Volume (24h)</TableHead>
              <TableHead>Market Cap</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Neynar Score</TableHead>
              <TableHead>Followers</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => {
              const lastPrice = token.tokenPrices[0];
              const tokenMcap =
                lastPrice?.marketCapUsd === 0
                  ? lastPrice?.fdvUsd
                  : lastPrice?.marketCapUsd;
              return (
                <TableRow key={token.address}>
                  <TableCell>
                    <Link
                      className={cn(buttonVariants({ variant: "link" }))}
                      href={`https://clanker.world/clanker/${token.address}`}
                      prefetch={false}
                    >
                      {formatAddress(token.address)}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate">
                    {token.name}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate">
                    {token.symbol}
                  </TableCell>
                  <TableCell className="text-right">
                    {lastPrice?.volumeUsdH24.toLocaleString() || "0"}
                  </TableCell>
                  <TableCell className="text-right">
                    {tokenMcap.toLocaleString() || "0"}
                  </TableCell>
                  <TableCell>
                    <Link
                      className={cn(buttonVariants({ variant: "link" }))}
                      href={`/table?user=${token.user?.username}`}
                      prefetch={false}
                    >
                      {token.user?.username}
                    </Link>
                  </TableCell>
                  <TableCell>{token.user?.neynarScore || 0}</TableCell>
                  <TableCell>{token.user?.followers || 0}</TableCell>
                  <TableCell>
                    {new Date(token.createdAt || 0).toLocaleTimeString() +
                      " - " +
                      new Date(token.createdAt || 0).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <hr />
      <Pagination page={page} take={take} totalPages={totalPages} />
    </>
  );
};

export default TokensTable;

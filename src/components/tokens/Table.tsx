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
import { TokenCard } from "../molecules/tokenCard";
import TokensGrid from "./Grid";

interface TokensTableProps {
  neynarScore: number;
  page: number;
  take: number;
}

const TokensTable: React.FC<TokensTableProps> = async ({
  neynarScore,
  page,
  take,
}) => {
  const skip = (page - 1) * take;

  const casts = await prisma.cast.findMany({
    include: { token: true, parent_user: true },
    orderBy: { castDate: "desc" },
    where: { parent_user: { neynarScore: { gte: neynarScore } } },
    skip,
    take,
  });

  const totalCasts = await prisma.cast.count({
    where: { parent_user: { neynarScore: { gte: neynarScore } } },
  });

  const tokenInfos = await fetchMultiTokenInfo(
    casts.map((cast) => cast.token?.address || "0x0")
  );
  const totalPages = Math.ceil(totalCasts / take);

  return (
    <>
      <div className="flex flex-col gap-4 mt-4 w-full max-w-full overflow-x-auto font-mono animate-in fade-in duration-300 animate-out">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          <TokensGrid page={page} />

          {/* {casts.map((cast) => {
            if (!cast.token) return null;
            const tokenInfo = tokenInfos.find((t) =>
              isAddressEqual(
                t.address as Address,
                (cast.token?.address || zeroAddress) as Address
              )
            );

            return (
              <TokenCard
                key={cast.token.address}
                token={{
                  address: cast.token.address as Address,
                  name: cast.token.name || "",
                  deployedAt: cast.castDate.toISOString(),
                  deployer: {
                    avatarUrl: "",
                    followers: cast.parent_user?.followers || 0,
                    score: cast.parent_user?.neynarScore || 0,
                    username: cast.parent_user?.username || "",
                  },
                  imageUrl: "",
                  marketCap: parseFloat(
                    tokenInfo?.market_cap_usd || tokenInfo?.fdv_usd || "0"
                  ),
                  symbol: cast.token.symbol || "",
                  volumeLastHour: parseFloat(tokenInfo?.volume_usd.h24 || "0"),
                }}
              />
            );
          })} */}
        </div>
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
            {casts.map((cast) => {
              if (!cast.token) return null;
              const tokenInfo = tokenInfos.find((t) =>
                isAddressEqual(
                  t.address as Address,
                  (cast.token?.address || zeroAddress) as Address
                )
              );
              return (
                <TableRow key={cast.token.address}>
                  <TableCell>
                    <Link
                      className={cn(buttonVariants({ variant: "link" }))}
                      href={`https://clanker.world/clanker/${cast.token.address}`}
                      prefetch={false}
                    >
                      {formatAddress(cast.token.address)}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate">
                    {cast.token.name}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate">
                    {cast.token.symbol}
                  </TableCell>
                  <TableCell className="text-right">
                    {parseFloat(tokenInfo?.volume_usd.h24 || "0").toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {parseFloat(
                      tokenInfo?.market_cap_usd || tokenInfo?.fdv_usd || "0"
                    ).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Link
                      className={cn(buttonVariants({ variant: "link" }))}
                      href={`https://nounspace.com/s/${cast.parent_user?.username}`}
                      prefetch={false}
                    >
                      {cast.parent_user?.username}
                    </Link>
                  </TableCell>
                  <TableCell>{cast.parent_user?.neynarScore || 0}</TableCell>
                  <TableCell>{cast.parent_user?.followers || 0}</TableCell>
                  <TableCell>
                    {new Date(cast.castDate).toLocaleTimeString() +
                      " - " +
                      new Date(cast.castDate).toLocaleDateString()}
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

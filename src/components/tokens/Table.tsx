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
      <div className="w-full max-w-full overflow-x-auto font-mono animate-in fade-in duration-300 animate-out">
        <Table>
          {/* <TableCaption>List of {casts.length} Tokens</TableCaption> */}
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>FDV</TableHead>
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
                    {parseFloat(tokenInfo?.fdv_usd || "0").toFixed(2)}
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

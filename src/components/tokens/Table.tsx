"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableCaption,
} from "@/components/ui/table";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../ui/button";
import { formatAddress } from "@/lib/ethereum";

interface TokensTableProps {
  casts: Prisma.CastGetPayload<{
    include: { token: true; parent_user: { include: { metrics: true } } };
  }>[];
}

const TokensTable: React.FC<TokensTableProps> = ({ casts }) => {
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <Table>
        <TableCaption>List of Tokens</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Address</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Neynar Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {casts.map((cast) => {
            if (!cast.token) return null;
            return (
              <TableRow key={cast.token.address}>
                <TableCell>
                  <Link
                    href={`https://clanker.world/clanker/${cast.token.address}`}
                  >
                    {formatAddress(cast.token.address)}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[80px] truncate">
                  {cast.token.name}
                </TableCell>
                <TableCell>{cast.token.symbol}</TableCell>
                <TableCell>
                  {new Date(cast.castDate).toLocaleTimeString() +
                    " - " +
                    new Date(cast.castDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Link
                    className={cn(buttonVariants({ variant: "link" }))}
                    href={`https://nounspace.com/s/${cast.parent_user?.username}`}
                  >
                    {cast.parent_user?.username}
                  </Link>
                </TableCell>
                <TableCell>
                  {cast.parent_user?.metrics[0]?.neynarScore || 0}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TokensTable;

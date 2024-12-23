import prisma from "@/lib/prisma";
import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAddress } from "@/lib/ethereum";

export default async function DbPage() {
  const users = await prisma.user.findMany({
    include: { metrics: true, wallets: true, casts: true },
  });

  return (
    <div className="flex gap-1 items-center justify-center min-h-screen py-2">
      <div className="overflow-x-auto">
        <Table>
          <TableCaption>A list of users in the database.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>FID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Followers</TableHead>
              <TableHead>Following</TableHead>
              <TableHead>Relevance</TableHead>
              <TableHead>Casts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-mono">
            {users.map((user) => (
              <TableRow key={user.fid}>
                <TableCell>{user.fid}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{formatAddress(user.wallets[0].address)}</TableCell>
                <TableCell>{user.metrics[0].followers}</TableCell>
                <TableCell>{user.metrics[0].following}</TableCell>
                <TableCell>{user.metrics[0].relevance}</TableCell>
                <TableCell>{user.casts.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

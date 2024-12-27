import { buttonVariants } from "@/components/ui/button";
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
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link"; // Added import

export default async function DbPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  headers();

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const pageSize = 20;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      include: { metrics: true, wallets: true, casts: true, parentCasts: true },
      where: { wallets: { some: { address: { not: undefined } } } },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.user.count({
      where: { wallets: { some: { address: { not: undefined } } } },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex gap-1 items-center justify-center min-h-screen py-2">
      <div className="overflow-x-auto">
        <Table>
          <TableCaption>
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, total)} of {total.toLocaleString()} users
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>FID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Followers</TableHead>
              <TableHead>Following</TableHead>
              <TableHead>Relevance</TableHead>
              <TableHead>Casts</TableHead>
              <TableHead>Parent Casts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-mono">
            {users.map((user) => (
              <TableRow key={user.fid}>
                <TableCell>{user.fid}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  {formatAddress(user.wallets[0]?.address || "0x")}
                </TableCell>
                <TableCell>{user.metrics[0].followers}</TableCell>
                <TableCell>{user.metrics[0].following}</TableCell>
                <TableCell>{user.metrics[0].relevance}</TableCell>
                <TableCell>{user.casts.length}</TableCell>
                <TableCell>{user.parentCasts.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex w-full justify-between">
          <Link
            href={`?page=${page - 1}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              page <= 1 && "pointer-events-none opacity-30"
            )}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Link>
          <Link
            href={`?page=${page + 1}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              page >= totalPages && "pointer-events-none opacity-30"
            )}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}

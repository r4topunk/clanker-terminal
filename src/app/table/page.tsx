import Navbar from "@/components/molecules/navbar";
import TokensTable from "@/components/tokens/Table";
import { Suspense } from "react";

export const revalidate = 60;

export default function TablePage({
  searchParams,
}: {
  searchParams: { neynarScore?: string; take?: string; page?: string };
}) {
  const neynarScore = parseFloat(searchParams.neynarScore || "0.95");
  const take = parseInt(searchParams.take || "300");
  const page = parseInt(searchParams.page || "1");

  return (
    <div className="container min-h-screen py-2 mx-auto flex flex-col gap-2">
      <Navbar />
      <Suspense
        key={`${neynarScore}-${take}-${page}`}
        fallback={
          <div className="grow flex justify-center items-center">
            <span>Loading...</span>
          </div>
        }
      >
        <TokensTable neynarScore={neynarScore} page={page} take={take} />
      </Suspense>
    </div>
  );
}

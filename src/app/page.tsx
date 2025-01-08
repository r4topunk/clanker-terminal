import Navbar from "@/components/molecules/navbar";
import TokensGrid from "@/components/tokens/Grid";
import TokensTable from "@/components/tokens/Table";
import { Suspense } from "react";

export const revalidate = 1;

export default function Home({
  searchParams,
}: {
  searchParams: { neynarScore?: string; take?: string; page?: string };
}) {
  const page = parseInt(searchParams.page || "1");

  return (
    <div className="container min-h-screen py-2 mx-auto flex flex-col gap-2">
      <Navbar />
      <Suspense
        key={`${page}`}
        fallback={
          <div className="grow flex justify-center items-center">
            <span>Loading...</span>
          </div>
        }
      >
        <TokensGrid page={page} />
      </Suspense>
    </div>
  );
}

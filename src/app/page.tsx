import Navbar from "@/components/molecules/navbar";
import TokensGrid from "@/components/tokens/Grid";
import { getClankerTokens } from "@/lib/clanker";
import { Suspense } from "react";

export const revalidate = 60;

export default async function Home({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || "1");
  const tokens = await getClankerTokens(page);

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
        <TokensGrid page={page} defaultTokens={tokens} />
      </Suspense>
    </div>
  );
}

import Navbar from "@/components/molecules/navbar";
import TokensTable from "@/components/tokens/Table";
import { fetchMultiTokenInfo } from "@/lib/gecko";
import prisma from "@/lib/prisma";

export const revalidate = 60;

export default async function Home({
  searchParams,
}: {
  searchParams: { neynarScore?: string };
}) {
  const neynarScore = parseFloat(searchParams.neynarScore || "0.95");

  const casts = await prisma.cast.findMany({
    include: { token: true, parent_user: true },
    orderBy: { castDate: "desc" },
    where: { parent_user: { neynarScore: { gte: neynarScore } } },
    take: 100,
  });

  const geckoResponse = await fetchMultiTokenInfo(
    casts.map((cast) => cast.token?.address || "0x0").splice(0, 30)
  );
  const tokenInfo = geckoResponse.data.map((token) => token.attributes);

  return (
    <div className="container min-h-screen py-2 mx-auto flex flex-col">
      <Navbar />
      <TokensTable casts={casts} tokenInfos={tokenInfo} />
    </div>
  );
}

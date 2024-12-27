import Navbar from "@/components/molecules/navbar";
import TokensTable from "@/components/tokens/Table";
import prisma from "@/lib/prisma";

export default async function Home() {
  const casts = await prisma.cast.findMany({
    include: { token: true, parent_user: true },
    orderBy: { castDate: "desc" },
    // take: 10,
  });

  const sortedCasts = casts
    .sort((a, b) => {
      const neynarDiff = b.parent_user.neynarScore - a.parent_user.neynarScore;
      if (neynarDiff !== 0) return neynarDiff;
      return b.parent_user.followers - a.parent_user.followers;
    })
    .slice(0, 333);

  return (
    <div className="container min-h-screen py-2 mx-auto flex flex-col">
      <Navbar />
      <TokensTable casts={sortedCasts} />
    </div>
  );
}

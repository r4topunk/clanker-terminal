import Navbar from "@/components/molecules/navbar";
import TokensTable from "@/components/tokens/Table";
import prisma from "@/lib/prisma";

export const revalidate = 60;

export default async function Home() {
  const casts = await prisma.cast.findMany({
    include: { token: true, parent_user: true },
    orderBy: { castDate: "desc" },
    where: { parent_user: { neynarScore: { gte: 0.95 } } },
  });

  return (
    <div className="container min-h-screen py-2 mx-auto flex flex-col">
      <Navbar />
      <TokensTable casts={casts} />
    </div>
  );
}

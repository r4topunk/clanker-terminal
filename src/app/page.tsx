import Navbar from "@/components/molecules/navbar";
import TokensTable from "@/components/tokens/Table";
import prisma from "@/lib/prisma";

export default async function Home() {
  const casts = await prisma.cast.findMany({
    include: { token: true, parent_user: { include: { metrics: true } } },
    orderBy: { castDate: "desc" },
    take: 1000,
  });

  console.log({ casts });

  return (
    <div className="container min-h-screen py-2 mx-auto flex flex-col">
      <Navbar />
      <TokensTable casts={casts} />
    </div>
  );
}

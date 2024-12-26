import { PrismaClient } from "@prisma/client";
import { seedCasts } from "./seedCasts";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  await seedCasts(prisma);
}

main()
  .then(() => console.log("Database seeded successfully!"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const missions = [
    {
      title: "Parrainer 5 personnes",
      description:
        "Parraine 5 personnes et fais activer leurs comptes pour recevoir 1 000 FCFA.",
      target: 5,
      reward: 1000,
    },
    {
      title: "Parrainer 10 personnes",
      description:
        "Parraine 10 personnes et fais activer leurs comptes pour recevoir 2 000 FCFA.",
      target: 10,
      reward: 2000,
    },
    {
      title: "Parrainer 30 personnes",
      description:
        "Parraine 30 personnes et fais activer leurs comptes pour recevoir 5 000 FCFA.",
      target: 30,
      reward: 5000,
    },
  ];

  for (const mission of missions) {
    await prisma.mission.upsert({
      where: {
        target: mission.target,
      },
      update: {
        title: mission.title,
        description: mission.description,
        reward: mission.reward,
        isActive: true,
      },
      create: mission,
    });
  }

  console.log("✅ Missions Nexora créées avec succès.");
}

main()
  .catch((error) => {
    console.error("❌ Erreur :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
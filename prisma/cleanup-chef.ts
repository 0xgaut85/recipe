import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupChefData() {
  console.log("Starting cleanup of chef/recipe/cooking related data...\n");

  try {
    // Find and delete users with "chef" in their name
    const usersWithChef = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: "chef", mode: "insensitive" } },
          { name: { contains: "recipe", mode: "insensitive" } },
          { name: { contains: "cooking", mode: "insensitive" } },
        ],
      },
      include: {
        strategies: true,
        trades: true,
        withdrawals: true,
        sessions: true,
        wallet: true,
      },
    });

    console.log(`Found ${usersWithChef.length} users with chef/recipe/cooking in name`);
    
    for (const user of usersWithChef) {
      console.log(`  - User: ${user.name || user.id} (${user.id})`);
      console.log(`    Strategies: ${user.strategies.length}, Trades: ${user.trades.length}`);
      
      // Delete user (cascades to related records)
      await prisma.user.delete({
        where: { id: user.id },
      });
      console.log(`    ✓ Deleted user and all related data`);
    }

    // Find and delete strategies with "chef" in name or description
    const strategiesWithChef = await prisma.strategy.findMany({
      where: {
        OR: [
          { name: { contains: "chef", mode: "insensitive" } },
          { description: { contains: "chef", mode: "insensitive" } },
          { name: { contains: "recipe", mode: "insensitive" } },
          { description: { contains: "recipe", mode: "insensitive" } },
          { name: { contains: "cooking", mode: "insensitive" } },
          { description: { contains: "cooking", mode: "insensitive" } },
        ],
      },
    });

    console.log(`\nFound ${strategiesWithChef.length} strategies with chef/recipe/cooking references`);
    
    for (const strategy of strategiesWithChef) {
      console.log(`  - Strategy: ${strategy.name} (${strategy.id})`);
      console.log(`    Description: ${strategy.description.substring(0, 50)}...`);
      
      await prisma.strategy.delete({
        where: { id: strategy.id },
      });
      console.log(`    ✓ Deleted strategy`);
    }

    console.log("\n✅ Cleanup complete!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupChefData()
  .then(() => {
    console.log("\nScript completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nScript failed:", error);
    process.exit(1);
  });

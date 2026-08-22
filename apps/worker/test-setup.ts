import { prisma } from "@dipantauin/prisma";

async function main() {
  console.log("Setting up test data...");

  // 1. Create a dummy user
  const user = await prisma.user.create({
    data: {
      email: "testworker@example.com",
      passwordHash: "dummy",
      name: "Worker Test User",
    }
  });
  console.log("Created test user:", user.id);

  // 2. Create a dummy product
  const product = await prisma.product.create({
    data: {
      url: "https://www.tokopedia.com/dummy-product",
      platform: "tokopedia.com",
      name: "Dummy Test Product",
      currentPrice: 100000, // 100,000 IDR
      status: "ACTIVE",
      nextCheckAt: new Date(Date.now() - 10000), // Set to past so worker picks it up immediately
    }
  });
  console.log("Created test product:", product.id);

  // 3. Track the product for the user with a target price
  const userProduct = await prisma.userProduct.create({
    data: {
      userId: user.id,
      productId: product.id,
      targetPrice: 75000, // They want to be notified if price drops to or below 75k
      notifyOnDrop: true,
      notifyOnIncrease: true,
      isActive: true,
    }
  });
  console.log("Created tracking record:", userProduct.id);

  console.log("\nSetup complete! You can now run `npm run dev` in apps/worker.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

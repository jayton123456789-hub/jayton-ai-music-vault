import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedUsers = [
  { username: "jayton", displayName: "Jayton", passcode: "1987" },
  { username: "dillon", displayName: "Dillon", passcode: "3141" },
  { username: "nick", displayName: "Nick", passcode: "3141" }
];

async function main() {
  for (const user of seedUsers) {
    const passcodeHash = await bcrypt.hash(user.passcode, 12);

    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        displayName: user.displayName,
        passcodeHash
      },
      create: {
        username: user.username,
        displayName: user.displayName,
        passcodeHash
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

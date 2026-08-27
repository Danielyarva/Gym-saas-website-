import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to seed the admin account.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin account already exists: ${email}`);
    return;
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Seeded ADMIN account: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

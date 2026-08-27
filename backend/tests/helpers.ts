import { prisma } from '../src/config/prisma';

/** Wipes every Phase 1 table in FK-safe order — called before each test file's suite so tests never see leftover rows from a previous run. */
export async function resetDatabase(): Promise<void> {
  await prisma.auditLog.deleteMany();
  await prisma.clientNote.deleteMany();
  await prisma.coachClient.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.coach.deleteMany();
  await prisma.user.deleteMany();
}

export function extractCookie(setCookieHeader: string[] | undefined, name: string): string | undefined {
  const raw = setCookieHeader?.find((cookie) => cookie.startsWith(`${name}=`));
  return raw?.split(';')[0]?.split('=')[1];
}

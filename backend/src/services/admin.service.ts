import type { Coach, Subscription, User } from '@prisma/client';
import { coachRepository } from '../repositories/coach.repository';

type CoachListRow = Coach & {
  user: Pick<User, 'email' | 'createdAt' | 'lastLoginAt'>;
  subscription: Pick<Subscription, 'plan'> | null;
  _count: { coachClients: number };
};

function toCoachSummary(row: CoachListRow) {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.user.email,
    plan: row.subscription?.plan ?? 'STARTER',
    activeClientCount: row._count.coachClients,
    createdAt: row.user.createdAt,
    lastLoginAt: row.user.lastLoginAt,
  };
}

async function listCoaches(search: string | undefined, page: number, pageSize: number) {
  const [items, total] = await coachRepository.list({ search, page, pageSize });
  return { items: items.map((item) => toCoachSummary(item as CoachListRow)), total, page, pageSize };
}

export const adminService = {
  listCoaches,
};

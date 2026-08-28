import { Prisma, type ClientStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface ListClientsFilters {
  search?: string;
  statuses?: ClientStatus[];
  archived: boolean;
  sortBy: 'fullName' | 'status' | 'adherencePct' | 'lastCheckInAt';
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface CreateClientInput {
  fullName: string;
  email: string;
  phone?: string;
  goalText?: string;
  startingWeightKg?: number;
  goalWeightKg?: number;
}

export interface UpdateClientInput {
  fullName?: string;
  phone?: string;
  status?: ClientStatus;
  goalText?: string;
  currentWeightKg?: number;
  goalWeightKg?: number;
}

function buildOrderBy(sortBy: ListClientsFilters['sortBy'], sortDir: ListClientsFilters['sortDir']) {
  if (sortBy === 'fullName') return { client: { fullName: sortDir } } satisfies Prisma.CoachClientOrderByWithRelationInput;
  return { [sortBy]: sortDir } as Prisma.CoachClientOrderByWithRelationInput;
}

/**
 * Every method here takes `coachId` as its first parameter and bakes it into
 * the Prisma `where` clause — this is the repository-layer backstop for the
 * "a coach can only ever access their own clients" invariant. There is no
 * method on this repository that can return another coach's data.
 */
export const clientRepository = {
  findByUserId(userId: string) {
    return prisma.client.findUnique({ where: { userId } });
  },

  findByEmail(email: string) {
    return prisma.client.findUnique({ where: { email } });
  },

  /** Links a newly-created User to this Client row — the invite-accept flow's one write. */
  linkUserAccount(clientId: string, userId: string) {
    return prisma.client.update({ where: { id: clientId }, data: { userId } });
  },

  /** Client reading their own record (identity IS ownership here — no separate owner id needed, unlike coach-scoped methods). */
  findOwnProfile(clientId: string) {
    return prisma.client.findUnique({ where: { id: clientId }, include: { profile: true } });
  },

  /** Onboarding step 3 sets the client's baseline weight — same "starting = current on day one" rule Phase 1 uses when a coach first adds a client. */
  updateOwnStartingWeight(clientId: string, weightKg: number) {
    return prisma.client.update({
      where: { id: clientId },
      data: { profile: { update: { startingWeightKg: weightKg, currentWeightKg: weightKg } } },
    });
  },

  updateOwnBasicInfo(
    clientId: string,
    input: { fullName?: string; phone?: string; dateOfBirth?: Date; gender?: string; heightCm?: number },
  ) {
    return prisma.client.update({
      where: { id: clientId },
      data: {
        fullName: input.fullName,
        phone: input.phone,
        profile: {
          update: {
            dateOfBirth: input.dateOfBirth,
            gender: input.gender,
            heightCm: input.heightCm,
          },
        },
      },
      include: { profile: true },
    });
  },

  async list(coachId: string, filters: ListClientsFilters) {
    const where: Prisma.CoachClientWhereInput = {
      coachId,
      archivedAt: filters.archived ? { not: null } : null,
      ...(filters.statuses && filters.statuses.length > 0 ? { status: { in: filters.statuses } } : {}),
      ...(filters.search
        ? {
            client: {
              OR: [
                { fullName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.coachClient.findMany({
        where,
        include: { client: { include: { profile: true } } },
        orderBy: buildOrderBy(filters.sortBy, filters.sortDir),
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.coachClient.count({ where }),
    ]);

    return { items, total };
  },

  findById(coachId: string, clientId: string) {
    return prisma.coachClient.findFirst({
      where: { coachId, clientId },
      include: { client: { include: { profile: true } } },
    });
  },

  create(coachId: string, input: CreateClientInput) {
    return prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          profile: {
            create: {
              goalText: input.goalText,
              startingWeightKg: input.startingWeightKg,
              currentWeightKg: input.startingWeightKg,
              goalWeightKg: input.goalWeightKg,
            },
          },
        },
        include: { profile: true },
      });

      const coachClient = await tx.coachClient.create({
        data: { coachId, clientId: client.id },
      });

      return { client, coachClient };
    });
  },

  async update(coachId: string, clientId: string, input: UpdateClientInput) {
    const existing = await prisma.coachClient.findFirst({ where: { coachId, clientId } });
    if (!existing) return null;

    const [client, coachClient] = await prisma.$transaction([
      prisma.client.update({
        where: { id: clientId },
        data: {
          fullName: input.fullName,
          phone: input.phone,
          profile: {
            update: {
              goalText: input.goalText,
              currentWeightKg: input.currentWeightKg,
              goalWeightKg: input.goalWeightKg,
            },
          },
        },
        include: { profile: true },
      }),
      prisma.coachClient.update({
        where: { id: existing.id },
        data: input.status ? { status: input.status } : {},
      }),
    ]);

    return { client, coachClient };
  },

  async setArchived(coachId: string, clientId: string, archived: boolean) {
    const existing = await prisma.coachClient.findFirst({ where: { coachId, clientId } });
    if (!existing) return null;

    return prisma.coachClient.update({
      where: { id: existing.id },
      data: { archivedAt: archived ? new Date() : null },
    });
  },

  async countByStatus(coachId: string) {
    const rows = await prisma.coachClient.groupBy({
      by: ['status'],
      where: { coachId, archivedAt: null },
      _count: true,
    });
    return rows;
  },

  async averageAdherenceAndProgress(coachId: string) {
    const result = await prisma.coachClient.aggregate({
      where: { coachId, archivedAt: null },
      _avg: { adherencePct: true, progressPct: true },
    });
    return result._avg;
  },
};

export const coachClientRepository = {
  findByCoachAndClient(coachId: string, clientId: string) {
    return prisma.coachClient.findFirst({ where: { coachId, clientId } });
  },

  /** The one place notification triggers and typing-indicator lookups fetch "who's on the other end of this client." */
  findByClientId(clientId: string) {
    return prisma.coachClient.findUnique({
      where: { clientId },
      include: {
        coach: { select: { userId: true, fullName: true, user: { select: { email: true } } } },
        client: { select: { userId: true, fullName: true, email: true } },
      },
    });
  },

  /** Bumps the sender's typing timestamp a few seconds into the future — the polled GET reports "typing" while it's still ahead of now. */
  setTyping(clientId: string, role: 'COACH' | 'CLIENT', typingUntil: Date) {
    return prisma.coachClient.updateMany({
      where: { clientId },
      data: role === 'COACH' ? { coachTypingUntil: typingUntil } : { clientTypingUntil: typingUntil },
    });
  },
};

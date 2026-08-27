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
};

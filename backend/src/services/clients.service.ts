import type { Client, ClientProfile, CoachClient } from '@prisma/client';
import { clientRepository, type ListClientsFilters, type CreateClientInput, type UpdateClientInput } from '../repositories/client.repository';
import { userRepository } from '../repositories/user.repository';
import { auditService } from './audit.service';
import { AppError } from '../utils/app-error';
import type { Request } from 'express';

type ClientWithProfile = Client & { profile: ClientProfile | null };

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function toClientSummary(coachClient: CoachClient & { client: ClientWithProfile }) {
  const { client } = coachClient;
  return {
    id: client.id,
    fullName: client.fullName,
    email: client.email,
    phone: client.phone,
    avatarUrl: client.profile?.avatarUrl ?? null,
    status: coachClient.status,
    adherencePct: coachClient.adherencePct,
    currentWeightKg: toNumberOrNull(client.profile?.currentWeightKg),
    goalWeightKg: toNumberOrNull(client.profile?.goalWeightKg),
    goalText: client.profile?.goalText ?? null,
    lastCheckInAt: coachClient.lastCheckInAt,
    archivedAt: coachClient.archivedAt,
  };
}

function toClientDetail(coachClient: CoachClient & { client: ClientWithProfile }) {
  const { client } = coachClient;
  return {
    id: client.id,
    fullName: client.fullName,
    email: client.email,
    phone: client.phone,
    status: coachClient.status,
    adherencePct: coachClient.adherencePct,
    progressPct: coachClient.progressPct,
    lastCheckInAt: coachClient.lastCheckInAt,
    archivedAt: coachClient.archivedAt,
    assignedAt: coachClient.assignedAt,
    profile: client.profile
      ? {
          avatarUrl: client.profile.avatarUrl,
          dateOfBirth: client.profile.dateOfBirth,
          gender: client.profile.gender,
          heightCm: toNumberOrNull(client.profile.heightCm),
          startingWeightKg: toNumberOrNull(client.profile.startingWeightKg),
          currentWeightKg: toNumberOrNull(client.profile.currentWeightKg),
          goalWeightKg: toNumberOrNull(client.profile.goalWeightKg),
          goalText: client.profile.goalText,
        }
      : null,
  };
}

async function list(coachId: string, filters: ListClientsFilters) {
  const { items, total } = await clientRepository.list(coachId, filters);
  return {
    items: items.map((item) => toClientSummary(item as CoachClient & { client: ClientWithProfile })),
    page: filters.page,
    pageSize: filters.pageSize,
    total,
  };
}

async function getById(coachId: string, clientId: string) {
  const coachClient = await clientRepository.findById(coachId, clientId);
  if (!coachClient) throw new AppError('NOT_FOUND', 'Client not found');
  return toClientDetail(coachClient as CoachClient & { client: ClientWithProfile });
}

async function create(coachId: string, input: CreateClientInput, req: Request) {
  const existingUser = await userRepository.findByEmail(input.email);
  if (existingUser) {
    throw new AppError('EMAIL_ALREADY_EXISTS', 'A client with this email already exists');
  }

  const { client, coachClient } = await clientRepository.create(coachId, input);
  await auditService.log({
    req,
    actorUserId: req.user?.id,
    action: 'CLIENT_CREATED',
    entityType: 'CLIENT',
    entityId: client.id,
    metadata: { fullName: client.fullName },
  });

  return toClientDetail({ ...coachClient, client } as CoachClient & { client: ClientWithProfile });
}

async function update(coachId: string, clientId: string, input: UpdateClientInput, req: Request) {
  const result = await clientRepository.update(coachId, clientId, input);
  if (!result) throw new AppError('NOT_FOUND', 'Client not found');

  if (input.status) {
    await auditService.log({
      req,
      actorUserId: req.user?.id,
      action: 'CLIENT_STATUS_CHANGED',
      entityType: 'CLIENT',
      entityId: clientId,
      metadata: { status: input.status },
    });
  }

  return toClientDetail({ ...result.coachClient, client: result.client } as CoachClient & { client: ClientWithProfile });
}

async function archive(coachId: string, clientId: string, req: Request) {
  const result = await clientRepository.setArchived(coachId, clientId, true);
  if (!result) throw new AppError('NOT_FOUND', 'Client not found');
  await auditService.log({ req, actorUserId: req.user?.id, action: 'CLIENT_ARCHIVED', entityType: 'CLIENT', entityId: clientId });
}

async function unarchive(coachId: string, clientId: string, req: Request) {
  const result = await clientRepository.setArchived(coachId, clientId, false);
  if (!result) throw new AppError('NOT_FOUND', 'Client not found');
  await auditService.log({ req, actorUserId: req.user?.id, action: 'CLIENT_UNARCHIVED', entityType: 'CLIENT', entityId: clientId });
}

export const clientsService = {
  list,
  getById,
  create,
  update,
  archive,
  unarchive,
};

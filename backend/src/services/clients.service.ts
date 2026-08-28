import type { Client, ClientProfile, CoachClient } from '@prisma/client';
import { clientRepository, type ListClientsFilters, type CreateClientInput, type UpdateClientInput } from '../repositories/client.repository';
import { userRepository } from '../repositories/user.repository';
import { coachRepository } from '../repositories/coach.repository';
import { clientInviteTokenRepository } from '../repositories/client-invite-token.repository';
import { emailService } from './email.service';
import { auditService } from './audit.service';
import { subscriptionService } from './subscription.service';
import { env } from '../config/env';
import { generateRawToken, hashToken } from '../utils/crypto';
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
    hasAccount: client.userId !== null,
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
  // Client.email and User.email are both globally unique (schema-level constraints),
  // and a future client could collide with either — check both up front so this
  // surfaces as 409 EMAIL_ALREADY_EXISTS instead of an uncaught Prisma constraint
  // violation turning into a 500.
  const [existingUser, existingClient] = await Promise.all([
    userRepository.findByEmail(input.email),
    clientRepository.findByEmail(input.email),
  ]);
  if (existingUser || existingClient) {
    throw new AppError('EMAIL_ALREADY_EXISTS', 'A client with this email already exists');
  }

  await subscriptionService.checkAndEnforceClientLimit(coachId);

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

async function invite(coachId: string, clientId: string, req: Request) {
  const coachClient = await clientRepository.findById(coachId, clientId);
  if (!coachClient) throw new AppError('NOT_FOUND', 'Client not found');
  if (coachClient.client.userId) {
    throw new AppError('CLIENT_ALREADY_LINKED', 'This client already has an account');
  }

  const coach = await coachRepository.findById(coachId);
  const rawToken = generateRawToken();
  const expiresAt = new Date(Date.now() + env.CLIENT_INVITE_TTL_HOURS * 60 * 60 * 1000);

  await clientInviteTokenRepository.create({
    clientId,
    invitedByCoachId: coachId,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });
  void emailService.sendClientInviteEmail(coachClient.client.email, coach!.fullName, rawToken);
  await auditService.log({ req, actorUserId: req.user?.id, action: 'CLIENT_INVITED', entityType: 'CLIENT', entityId: clientId });

  return { invitedAt: new Date(), expiresAt };
}

export const clientsService = {
  list,
  getById,
  create,
  update,
  archive,
  unarchive,
  invite,
};

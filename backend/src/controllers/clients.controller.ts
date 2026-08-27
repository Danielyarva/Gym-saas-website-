import type { Request, Response } from 'express';
import { clientsService } from '../services/clients.service';
import type { ListClientsFilters } from '../repositories/client.repository';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const list = asyncHandler(async (req: Request, res: Response) => {
  // validate(listClientsQuerySchema, 'query') has already replaced req.query
  // with the parsed, typed filters by the time this handler runs.
  const data = await clientsService.list(req.user!.coachId!, req.query as unknown as ListClientsFilters);
  sendSuccess(res, data);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const data = await clientsService.getById(req.user!.coachId!, req.params.id!);
  sendSuccess(res, data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await clientsService.create(req.user!.coachId!, req.body, req);
  sendSuccess(res, data, 'Client added', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await clientsService.update(req.user!.coachId!, req.params.id!, req.body, req);
  sendSuccess(res, data, 'Client updated');
});

export const archive = asyncHandler(async (req: Request, res: Response) => {
  await clientsService.archive(req.user!.coachId!, req.params.id!, req);
  sendSuccess(res, null, 'Client archived');
});

export const unarchive = asyncHandler(async (req: Request, res: Response) => {
  await clientsService.unarchive(req.user!.coachId!, req.params.id!, req);
  sendSuccess(res, null, 'Client restored');
});

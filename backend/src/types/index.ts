import type { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  role: Role;
  email: string;
  coachId?: string;
  clientId?: string;
}

export interface OwnedCoachClient {
  id: string;
  coachId: string;
  clientId: string;
}

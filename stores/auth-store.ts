import { create } from 'zustand';
import type { PublicCoach, PublicUser } from '@/types';

interface AuthState {
  user: PublicUser | null;
  coach: PublicCoach | null;
  setAuth: (user: PublicUser | null, coach: PublicCoach | null) => void;
  clear: () => void;
}

/**
 * Holds only the already-fetched, derived user/coach for synchronous UI
 * gating (e.g. nav items). It is never persisted and is never the source
 * of truth — TanStack Query's useMe() owns that; this is just a cache of
 * its result so components don't need to thread useMe() through props.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  coach: null,
  setAuth: (user, coach) => set({ user, coach }),
  clear: () => set({ user: null, coach: null }),
}));

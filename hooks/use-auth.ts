import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth-store';
import { ApiError } from '@/services/api-client';

export const authQueryKeys = {
  me: ['auth', 'me'] as const,
};

export function useMe(options?: { enabled?: boolean }) {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useQuery({
    queryKey: authQueryKeys.me,
    queryFn: async () => {
      const data = await authService.me();
      setAuth(data.user, data.coach);
      return data;
    },
    enabled: options?.enabled,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data.user, data.coach);
      queryClient.setQueryData(authQueryKeys.me, data);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setAuth(data.user, data.coach);
      queryClient.setQueryData(authQueryKeys.me, data);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clear);

  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}

export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.code === 'SESSION_REVOKED');
}

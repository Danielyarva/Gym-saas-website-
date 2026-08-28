import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';

const UNREAD_POLL_MS = 30000;

const keys = {
  list: (page: number) => ['notifications', page] as const,
};

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: keys.list(page),
    queryFn: () => notificationsService.list(page),
  });
}

/** Powers the header bell's badge — polls independently of whether the notifications page is open. */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'] as const,
    queryFn: () => notificationsService.list(1, 1),
    select: (data) => data.unreadCount,
    refetchInterval: UNREAD_POLL_MS,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

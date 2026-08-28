import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: adminService.getAnalytics,
  });
}

export function useAdminCoaches(search: string, page: number, pageSize = 20) {
  return useQuery({
    queryKey: ['admin', 'coaches', search, page, pageSize],
    queryFn: () => adminService.listCoaches(search, page, pageSize),
  });
}

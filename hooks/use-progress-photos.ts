import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { progressPhotosService } from '@/services/progress-photos.service';

const keys = {
  list: (clientId: string) => ['progress-photos', clientId] as const,
};

export function useProgressPhotos(clientId: string) {
  return useQuery({
    queryKey: keys.list(clientId),
    queryFn: () => progressPhotosService.list(clientId),
    enabled: Boolean(clientId),
  });
}

export function useUploadProgressPhoto(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, takenAt }: { file: File; takenAt: string }) => progressPhotosService.upload(clientId, file, takenAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(clientId) });
    },
  });
}

export function useDeleteProgressPhoto(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => progressPhotosService.remove(clientId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(clientId) });
    },
  });
}

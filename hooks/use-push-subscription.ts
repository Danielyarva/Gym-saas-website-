import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pushService } from '@/services/push.service';
import { registerServiceWorker, urlBase64ToUint8Array, isPushSupported } from '@/lib/push';

const STATUS_KEY = ['push-subscription-status'] as const;

/**
 * `navigator.serviceWorker.ready` only resolves once a service worker is
 * actually registered — before this app ever calls `registerServiceWorker`
 * (only the "Enable" mutation does), that would hang forever and leave the
 * opt-in card stuck pending indefinitely. `getRegistration` resolves
 * immediately with `undefined` when there's no registration yet.
 */
async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

/** Browser-side truth (is *this* browser already subscribed), not a server list — there's no "my subscriptions" endpoint, just subscribe/unsubscribe. */
export function usePushSubscriptionStatus() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: async () => ({ supported: isPushSupported(), subscribed: (await getExistingSubscription()) !== null }),
  });
}

export function useEnablePush() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission was not granted');
      }

      const registration = await registerServiceWorker();
      if (!registration) throw new Error('Push notifications are not supported in this browser');

      const { publicKey } = await pushService.getVapidPublicKey();
      if (!publicKey) throw new Error('Push notifications are not configured yet');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Push subscription is missing required fields');
      }

      await pushService.subscribe({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    },
  });
}

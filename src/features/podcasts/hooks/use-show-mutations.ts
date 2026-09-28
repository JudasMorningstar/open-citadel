import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { showToast } from '@/components/toast/toast-provider';
import * as actions from '@/services/podcasts/actions';
import { haptics } from '@/utils/haptics';

/**
 * Following, leaving and refreshing one show. Each is a mutation so a second
 * press while the first is still writing does nothing, and the refresh's
 * pending state is what the pull-to-refresh spinner shows. The actions
 * themselves invalidate the library when they land.
 */
export function useShowMutations(showId: string | null, title: string) {
  const router = useRouter();

  const follow = useMutation({
    mutationFn: (id: string) => actions.subscribe(id),
    onMutate: () => haptics.commit(),
    onSuccess: () => showToast({ message: `Following ${title}`, tone: 'success' }),
  });
  const unfollow = useMutation({
    mutationFn: (id: string) => actions.unsubscribe(id),
    onMutate: () => haptics.warn(),
    onSuccess: () => router.back(),
  });
  const refresh = useMutation({
    mutationFn: (id: string) => actions.refreshShowNow(id),
    onSuccess: (failure) => failure && showToast({ message: failure }),
  });

  return {
    follow: () => showId && !follow.isPending && follow.mutate(showId),
    unfollow: async () => {
      if (showId && !unfollow.isPending) await unfollow.mutateAsync(showId);
    },
    refresh: () => showId && !refresh.isPending && refresh.mutate(showId),
    refreshing: refresh.isPending,
  };
}

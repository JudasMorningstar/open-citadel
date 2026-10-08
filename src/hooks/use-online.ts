import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);
const isOnline = () => onlineManager.isOnline();

/**
 * Whether the phone has a connection, for a screen that wants to say so.
 *
 * Read from the query cache's own online state (`lib/query-client.ts`), so a
 * screen and the cache never disagree about it. True in a build without
 * `expo-network`, which cannot tell.
 */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, isOnline, isOnline);
}

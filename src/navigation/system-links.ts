/*
 * Addresses the system opens the app with that are not routes.
 *
 * Kept apart from anything that imports React Native, since the router's
 * `+native-intent` reads this before the app has rendered.
 */

/**
 * What a tap on the media notification opens the app with. Set in the patch
 * to `@rntp/player` (its `sessionActivity` intent): the library's own intent
 * only brings the app forward and says nothing about why.
 */
const PLAYER_NOTIFICATION_LINK = 'trackplayer://notification.click';

/** Whether the app was opened, or brought forward, by a tap on the media notification. */
export function isPlayerNotificationLink(url: string | null | undefined): boolean {
  return !!url && url.startsWith(PLAYER_NOTIFICATION_LINK);
}

/**
 * The podcast row types, and the few helpers every podcast service shares for
 * writing them.
 */
import * as Crypto from "expo-crypto";

import type { podcastEpisodes, podcasts } from "@/db/schema";

export type Podcast = typeof podcasts.$inferSelect;
export type Episode = typeof podcastEpisodes.$inferSelect;
export type NewEpisode = typeof podcastEpisodes.$inferInsert;

/**
 * An episode as a list draws it: everything but the full show notes (which
 * can be tens of kilobytes each and are only read on the episode screen), plus
 * the few facts about its show that a row needs.
 */
export type EpisodeItem = Omit<Episode, "description"> & {
  showTitle: string;
  showImageUrl: string | null;
};

/** A show as a shelf draws it, with how many episodes are waiting in it. */
export type ShowItem = Podcast & { newCount: number };

export function newId(): string {
  return Crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** The name a show goes by: the reader's own, when they gave it one. */
export function showName(show: Pick<Podcast, "title" | "customTitle">): string {
  return show.customTitle?.trim() || show.title;
}

/**
 * Hands the JS thread back between chunks of a long write, so a large import
 * or a thousand-episode subscribe keeps the screen answering (and its progress
 * moving) instead of freezing until the last row lands.
 */
export function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Rows per INSERT. SQLite caps a statement at 999 bound values and an episode
 * row has about thirty columns, so thirty rows sits safely under it.
 */
export const INSERT_CHUNK = 30;

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

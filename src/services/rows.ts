/**
 * The small helpers every service that writes rows shares: ids, timestamps,
 * and writing a long list in chunks without freezing the screen.
 */
import * as Crypto from "expo-crypto";

export function newId(): string {
  return Crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Hands the JS thread back between chunks of a long write, so a large import
 * or a thousand-episode subscribe keeps the screen answering (and its progress
 * moving) instead of freezing until the last row lands.
 */
export function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

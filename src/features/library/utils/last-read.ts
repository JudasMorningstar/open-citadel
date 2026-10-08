/**
 * Books in the order they were last read, the most recent first; books not
 * opened yet after them, newest added first. Pure.
 */
export function byLastRead<T extends { id: string; addedAt: string }>(books: T[], lastRead: Record<string, string>): T[] {
  return [...books].sort((a, b) => {
    const readA = lastRead[a.id];
    const readB = lastRead[b.id];
    if (readA && readB) return readB.localeCompare(readA);
    if (readA) return -1;
    if (readB) return 1;
    return b.addedAt.localeCompare(a.addedAt);
  });
}

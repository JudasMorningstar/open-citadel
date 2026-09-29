/**
 * "Something is in their library now", told by the tools that put it there.
 *
 * A signal rather than a call into the onboarding store. The store reaches
 * these tools through `cloud-chat`, so the tools reaching back into the store
 * was an import cycle; now the store listens here and nothing here imports it.
 */
let listener: (() => void) | null = null;

/** The onboarding store's hook. One listener: there is one store. */
export function onLibraryReady(fn: () => void): void {
  listener = fn;
}

export function libraryReady(): void {
  listener?.();
}

/** What a free book's page offers, in the one place that decides it. */
export type FreeBookAction =
  | 'loading'
  | 'download'
  | 'downloading'
  /** Downloaded, and waiting for the Library's scan to bring it in. */
  | 'adding'
  | 'read'
  /** Still under copyright: not offered here, only linked to. */
  | 'copyrighted'
  /** The page could not be loaded, or there is no EPUB to fetch. */
  | 'unavailable';

type ActionInput = {
  detail: 'loading' | 'ready' | 'failed';
  hasEpub: boolean;
  downloadable: boolean;
  inLibrary: boolean;
  downloading: boolean;
  downloaded: boolean;
};

export function freeBookAction(input: ActionInput): FreeBookAction {
  if (input.inLibrary) return 'read';
  if (input.downloading) return 'downloading';
  if (input.downloaded) return 'adding';
  if (input.detail === 'loading') return 'loading';
  if (input.detail === 'failed' || !input.hasEpub) return 'unavailable';
  return input.downloadable ? 'download' : 'copyrighted';
}

const LABELS: Record<FreeBookAction, string> = {
  loading: 'DOWNLOAD',
  download: 'DOWNLOAD',
  downloading: 'DOWNLOADING',
  adding: 'ADDING TO LIBRARY',
  read: 'READ',
  copyrighted: 'VIEW ON PROJECT GUTENBERG',
  unavailable: 'VIEW ON PROJECT GUTENBERG',
};

export function freeBookActionLabel(action: FreeBookAction): string {
  return LABELS[action];
}

/** The line under the button: what pressing it will do, or why it cannot. */
export function freeBookActionHint(action: FreeBookAction, detail: 'loading' | 'ready' | 'failed'): string | null {
  switch (action) {
    case 'download':
      return 'A free EPUB. It goes into your Open Citadel folder.';
    case 'adding':
      return 'Downloaded. It will be on your shelves in a moment.';
    case 'read':
      return 'In your library.';
    case 'copyrighted':
      return 'This book is still under copyright, so it is not offered here. Project Gutenberg has the details.';
    case 'unavailable':
      return detail === 'failed'
        ? 'Could not reach Project Gutenberg. Check your connection.'
        : 'There is no EPUB of this book to download.';
    default:
      return null;
  }
}

/** Whether the button is busy, and whether it takes a press at all. */
export function freeBookActionState(action: FreeBookAction): { loading: boolean; disabled: boolean } {
  return {
    loading: action === 'downloading' || action === 'adding',
    disabled: action === 'loading' || action === 'downloading' || action === 'adding',
  };
}

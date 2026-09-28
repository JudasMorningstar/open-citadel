/** What the Library's getting-started page says, by platform. Pure. */
export type BooksWelcomeCopy = {
  /** The door that brings the reader's own books in. */
  ownTitle: string;
  ownDetail: string;
  /** The trust line: where the books live. */
  trust: string;
};

/**
 * iOS copies EPUBs in with the document picker; Android reads them where
 * they are, from a folder the reader chooses, and keeps that folder in step.
 */
export function booksWelcomeCopy(platform: string | undefined): BooksWelcomeCopy {
  return platform === 'ios'
    ? {
        ownTitle: 'Add your books',
        ownDetail: 'EPUB files from Files, kept in order for you.',
        trust: 'Your books stay on this phone. Nothing is uploaded.',
      }
    : {
        ownTitle: 'Choose your books folder',
        ownDetail: 'Every EPUB in it comes in, and new ones as you add them.',
        trust: 'Your books are read where they are. Nothing is uploaded.',
      };
}

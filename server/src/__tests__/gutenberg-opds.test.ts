import { describe, expect, it } from 'vitest';

import { parseOpdsList } from '../gutenberg-opds.js';

// Trimmed from Gutenberg's live search feed.
const FEED = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<id>http://www.gutenberg.org/ebooks/search.opds/?query=marcus%20aurelius</id>
<title>Books: marcus aurelius</title>
<entry>
<id>https://www.gutenberg.org/ebooks/search.opds/?sort_order=downloads</id>
<title>Sort by popularity</title>
</entry>
<entry>
<id>https://www.gutenberg.org/ebooks/2680.opds</id>
<title>Meditations</title>
<content type="text">Emperor of Rome Marcus Aurelius</content>
</entry>
<entry>
<id>https://www.gutenberg.org/ebooks/1984.opds</id>
<title>Smith &amp; Jones</title>
</entry>
</feed>`;

describe('parseOpdsList', () => {
  it('reads the books and skips the feed’s own links', () => {
    expect(parseOpdsList(FEED, 10)).toEqual([
      { id: 2680, title: 'Meditations', author: 'Emperor of Rome Marcus Aurelius' },
      { id: 1984, title: 'Smith & Jones', author: null },
    ]);
  });

  it('stops at the limit', () => {
    expect(parseOpdsList(FEED, 1)).toHaveLength(1);
  });

  it('finds nothing in a page that is not a feed', () => {
    expect(parseOpdsList('<html><body>Blocked</body></html>', 10)).toEqual([]);
  });
});

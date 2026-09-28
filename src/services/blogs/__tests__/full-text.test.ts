import { describe, expect, it } from 'vitest';

import { extractArticle, isTeaser } from '@/services/blogs/full-text';

const LONG = Array.from({ length: 12 }, (_, i) => `<p>Paragraph ${i} ${'of careful, considered prose '.repeat(8)}</p>`).join('');

describe('isTeaser', () => {
  it('treats a short or cut-off copy as a teaser', () => {
    expect(isTeaser(null)).toBe(true);
    expect(isTeaser('<p>Just the first paragraph.</p>')).toBe(true);
    expect(isTeaser(`${LONG}<p>Continue reading →</p>`)).toBe(true);
    expect(isTeaser(`${LONG}<p>and so it goes [&#8230;]</p>`)).toBe(true);
  });

  it('treats a long copy as the post', () => {
    expect(isTeaser(LONG)).toBe(false);
  });
});

describe('extractArticle', () => {
  it('pulls the article out of a page, leaving the navigation behind', async () => {
    const page = `<!doctype html><html><head><title>Post</title></head><body>
      <nav><a href="/">Home</a><a href="/about">About</a></nav>
      <article><h1>The Post</h1>${LONG}</article>
      <footer>Copyright and a newsletter signup</footer>
    </body></html>`;
    const content = await extractArticle(page);
    expect(content).toContain('Paragraph 11');
    expect(content).not.toContain('newsletter signup');
  });

  it('finds nothing on a page with no article', async () => {
    expect(await extractArticle('<html><body><nav><a href="/">Home</a></nav></body></html>')).toBeNull();
  });
});

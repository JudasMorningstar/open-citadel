import { describe, expect, it } from 'vitest';

import { firstImage, htmlToText, summarize } from '@/services/blogs/feed/text';

describe('htmlToText', () => {
  it('drops tags, scripts and comments, and keeps words apart at block edges', () => {
    expect(htmlToText('<p>One</p><p>Two&nbsp;&amp; three</p><script>x()</script><!-- no -->')).toBe('One Two & three');
    expect(htmlToText('line<br/>next')).toBe('line next');
  });
});

describe('summarize', () => {
  it('leaves short text alone', () => {
    expect(summarize('Short.')).toBe('Short.');
    expect(summarize('   ')).toBeNull();
  });

  it('cuts at a word with an ellipsis', () => {
    const cut = summarize('The quick brown fox jumps over the lazy dog', 20)!;
    expect(cut).toBe('The quick brown fox…');
    expect(cut.length).toBeLessThanOrEqual(20);
  });
});

describe('firstImage', () => {
  it('skips data images and tracking pixels', () => {
    const html = '<img src="data:image/png;base64,AA"><img src="/px.gif" width="1" height="1"><img src="a.jpg">';
    expect(firstImage(html, 'https://example.com/posts/x')).toBe('https://example.com/posts/a.jpg');
  });

  it('returns null when there is nothing to show', () => {
    expect(firstImage('<p>no pictures</p>', null)).toBeNull();
    expect(firstImage(null, null)).toBeNull();
  });
});

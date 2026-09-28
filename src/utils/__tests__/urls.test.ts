import { describe, expect, it } from 'vitest';

import { hostOf, originOf, resolveUrl } from '@/utils/urls';

describe('resolveUrl', () => {
  const base = 'https://example.com/blog/2024/post.html?x=1#top';

  it('leaves an absolute address alone', () => {
    expect(resolveUrl('https://cdn.example.com/a.png', base)).toBe('https://cdn.example.com/a.png');
    expect(resolveUrl('data:image/png;base64,AAA', base)).toBe('data:image/png;base64,AAA');
  });

  it('reads a root-relative address against the origin', () => {
    expect(resolveUrl('/feed.xml', base)).toBe('https://example.com/feed.xml');
  });

  it('reads a path-relative address against the directory', () => {
    expect(resolveUrl('images/a.png', base)).toBe('https://example.com/blog/2024/images/a.png');
    expect(resolveUrl('../a.png', base)).toBe('https://example.com/blog/a.png');
    expect(resolveUrl('./a.png', 'https://example.com')).toBe('https://example.com/a.png');
  });

  it('keeps the scheme for a protocol-relative address', () => {
    expect(resolveUrl('//cdn.example.com/a.png', base)).toBe('https://cdn.example.com/a.png');
  });

  it('gives up without an absolute base', () => {
    expect(resolveUrl('a.png', null)).toBeNull();
    expect(resolveUrl('a.png', '/relative')).toBeNull();
    expect(resolveUrl('  ', base)).toBeNull();
  });
});

describe('originOf and hostOf', () => {
  it('reads the origin and a bare host', () => {
    expect(originOf('https://www.Example.com:8080/a')).toBe('https://www.Example.com:8080');
    expect(hostOf('https://www.Example.com:8080/a')).toBe('example.com');
    expect(hostOf('not a url')).toBeNull();
  });
});

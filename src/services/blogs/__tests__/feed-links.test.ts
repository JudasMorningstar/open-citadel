import { describe, expect, it } from 'vitest';

import { feedLinksInPage, guessedFeedUrls } from '@/services/blogs/feed-links';

describe('feedLinksInPage', () => {
  const page = `<!doctype html><html><head>
    <link rel="stylesheet" href="/style.css">
    <link rel="alternate" type="application/rss+xml" title="Comments on Blog" href="/comments/feed/">
    <link rel="alternate" type="application/atom+xml" href="/atom.xml">
    <link rel='alternate' type='application/rss+xml' title='Blog &raquo; Feed' href='https://blog.example.com/feed/'>
    <link rel="alternate" hreflang="fr" href="/fr/">
  </head><body><link rel="alternate" type="application/rss+xml" href="/body-feed"></body></html>`;

  it('lists RSS before Atom, leaves out comment feeds and anything outside the head', () => {
    expect(feedLinksInPage(page, 'https://blog.example.com/about')).toEqual([
      'https://blog.example.com/feed/',
      'https://blog.example.com/atom.xml',
    ]);
  });

  it('finds nothing on a page with no feed', () => {
    expect(feedLinksInPage('<html><head><title>x</title></head></html>', 'https://x.com')).toEqual([]);
  });
});

describe('guessedFeedUrls', () => {
  it('tries the usual paths on the site root', () => {
    const urls = guessedFeedUrls('https://example.com/some/post');
    expect(urls[0]).toBe('https://example.com/feed');
    expect(urls).toContain('https://example.com/index.xml');
  });
});

describe('iconsInPage', () => {
  it('prefers the home-screen icon, then large icons, and never a favicon or SVG', async () => {
    const { iconsInPage } = await import('@/services/blogs/site-icon');
    const page = `<html><head>
      <link rel="icon" href="/favicon.ico">
      <link rel="icon" type="image/svg+xml" href="/icon.svg">
      <link rel="icon" sizes="32x32" href="/small.png">
      <link rel="icon" sizes="192x192" href="/big.png">
      <link rel="apple-touch-icon" href="/touch.png?v=1&amp;x=2">
    </head></html>`;
    expect(iconsInPage(page, 'https://ex.com/post')).toEqual(['https://ex.com/touch.png?v=1&x=2', 'https://ex.com/big.png']);
    expect(iconsInPage('<head><link rel="icon" href="/favicon.ico"></head>', 'https://ex.com')).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';

import { BlogFeedError, looksLikeFeed, parseBlogFeed } from '@/services/blogs/feed-parser';

const NOW = new Date('2026-09-27T12:00:00Z');

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>Farnam Street</title>
  <link>https://fs.blog</link>
  <description>Mastering the best of what other people have already figured out</description>
  <language>en-US</language>
  <image><url>https://fs.blog/logo.png</url></image>
  <item>
    <title>The Map Is Not the Territory</title>
    <link>https://fs.blog/map-and-territory/</link>
    <guid isPermaLink="false">https://fs.blog/?p=123</guid>
    <dc:creator><![CDATA[Shane Parrish]]></dc:creator>
    <pubDate>Mon, 06 May 2024 07:08:09 +0000</pubDate>
    <description><![CDATA[<p>A map is a reduction of what it represents.</p>]]></description>
    <content:encoded><![CDATA[<p>Intro</p><img src="data:image/gif;base64,R0lGOD" /><img src="/wp/map.jpg" width="600" /><p>The whole post.</p>]]></content:encoded>
  </item>
  <item>
    <title>From the future</title>
    <link>/future/</link>
    <pubDate>Mon, 01 Jan 2099 00:00:00 +0000</pubDate>
    <description>Soon &amp; later</description>
    <media:thumbnail url="https://fs.blog/thumb.jpg" />
  </item>
  <item>
    <title>No link, no post</title>
    <description>Dropped</description>
  </item>
  <item>
    <title>The Map Is Not the Territory (again)</title>
    <link>https://fs.blog/map-and-territory/</link>
  </item>
</channel>
</rss>`;

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
  <title>Example Essays</title>
  <subtitle>Long reads</subtitle>
  <link href="https://example.com/feed.xml" rel="self"/>
  <link href="https://example.com/"/>
  <author><name>Ada Writer</name></author>
  <icon>/favicon.png</icon>
  <entry>
    <title type="html">On &lt;em&gt;Attention&lt;/em&gt;</title>
    <link href="https://example.com/attention" rel="alternate"/>
    <id>urn:uuid:1</id>
    <published>2024-02-03T04:05:06Z</published>
    <content type="html">&lt;p&gt;Attention is a &lt;b&gt;budget&lt;/b&gt;.&lt;/p&gt;</content>
  </entry>
  <entry>
    <title>Inline</title>
    <link href="https://example.com/inline"/>
    <id>urn:uuid:2</id>
    <updated>2024-02-04T00:00:00Z</updated>
    <author><name>Guest</name></author>
    <summary type="xhtml"><div xmlns="http://www.w3.org/1999/xhtml"><p>Short <i>form</i>.</p></div></summary>
  </entry>
</feed>`;

const RDF = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel rdf:about="https://old.example.org/">
    <title>Old School</title>
    <link>https://old.example.org/</link>
    <description>RSS 1.0 lives</description>
  </channel>
  <item rdf:about="https://old.example.org/1">
    <title>First</title>
    <link>https://old.example.org/1</link>
    <description>One</description>
    <dc:date>2023-01-02T03:04:05Z</dc:date>
  </item>
</rdf:RDF>`;

describe('parseBlogFeed: RSS 2.0', () => {
  const blog = parseBlogFeed(RSS, 'https://fs.blog/feed/', NOW);

  it('reads the blog', () => {
    expect(blog).toMatchObject({
      type: 'rss',
      title: 'Farnam Street',
      siteUrl: 'https://fs.blog',
      language: 'en-US',
      imageUrl: 'https://fs.blog/logo.png',
    });
  });

  it('keeps the whole post and a plain summary from the short form', () => {
    const [post] = blog.articles;
    expect(post.title).toBe('The Map Is Not the Territory');
    expect(post.author).toBe('Shane Parrish');
    expect(post.guid).toBe('https://fs.blog/?p=123');
    expect(post.publishedAt).toBe('2024-05-06T07:08:09.000Z');
    expect(post.contentHtml).toContain('The whole post.');
    expect(post.summary).toBe('A map is a reduction of what it represents.');
  });

  it('skips inline data images and resolves the first real one', () => {
    expect(blog.articles[0].imageUrl).toBe('https://fs.blog/wp/map.jpg');
  });

  it('reads relative links, caps future dates and prefers a named thumbnail', () => {
    const future = blog.articles[1];
    expect(future.link).toBe('https://fs.blog/future/');
    expect(future.publishedAt).toBe(NOW.toISOString());
    expect(future.imageUrl).toBe('https://fs.blog/thumb.jpg');
    expect(future.summary).toBe('Soon & later');
  });

  it('drops posts with no link and repeats of a link', () => {
    expect(blog.articles.map((a) => a.link)).toEqual(['https://fs.blog/map-and-territory/', 'https://fs.blog/future/']);
  });
});

describe('parseBlogFeed: Atom', () => {
  const blog = parseBlogFeed(ATOM, 'https://example.com/feed.xml', NOW);

  it('reads the blog, its home page and its icon', () => {
    expect(blog).toMatchObject({
      type: 'atom',
      title: 'Example Essays',
      siteUrl: 'https://example.com/',
      description: 'Long reads',
      imageUrl: 'https://example.com/favicon.png',
      language: 'en',
    });
  });

  it('decodes escaped HTML content and titles', () => {
    const [post] = blog.articles;
    expect(post.title).toBe('On Attention');
    expect(post.contentHtml).toBe('<p>Attention is a <b>budget</b>.</p>');
    expect(post.author).toBe('Ada Writer');
  });

  it('keeps inline XHTML as markup, and a post author over the blog author', () => {
    const inline = blog.articles[1];
    expect(inline.contentHtml).toBe('<p>Short <i>form</i>.</p>');
    expect(inline.summary).toBe('Short form.');
    expect(inline.author).toBe('Guest');
    expect(inline.publishedAt).toBe('2024-02-04T00:00:00.000Z');
  });
});

describe('parseBlogFeed: RSS 1.0', () => {
  it('reads items that sit beside the channel', () => {
    const blog = parseBlogFeed(RDF, null, NOW);
    expect(blog.type).toBe('rdf');
    expect(blog.articles).toHaveLength(1);
    expect(blog.articles[0]).toMatchObject({ link: 'https://old.example.org/1', publishedAt: '2023-01-02T03:04:05.000Z' });
  });
});

describe('not a feed', () => {
  it('says so', () => {
    expect(() => parseBlogFeed('<html><body>hi</body></html>', null, NOW)).toThrow(BlogFeedError);
  });

  it('tells a page from a feed by its first element', () => {
    expect(looksLikeFeed(RSS)).toBe(true);
    expect(looksLikeFeed(ATOM)).toBe(true);
    expect(looksLikeFeed('<!doctype html><html><head><link rel="alternate" href="/feed"></head></html>')).toBe(false);
  });
});

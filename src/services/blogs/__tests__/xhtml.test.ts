import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { describe, expect, it } from 'vitest';

import { toXhtmlBody } from '@/services/blogs/epub/xhtml';

const BASE = 'https://blog.example.com/2024/post/';

function wellFormed(body: string): boolean {
  return XMLValidator.validate(`<body>${body}</body>`) === true;
}

describe('toXhtmlBody', () => {
  it('closes what blog HTML leaves open and escapes bare ampersands', () => {
    const body = toXhtmlBody('<p>Salt & pepper<p>Second<br>line<ul><li>one<li>two</ul>', BASE);
    expect(wellFormed(body)).toBe(true);
    expect(body).toBe('<p>Salt &amp; pepper</p><p>Second<br/>line</p><ul><li>one</li><li>two</li></ul>');
  });

  it('drops scripts, styles, forms and embeds with their contents', () => {
    const body = toXhtmlBody(
      '<p>Keep</p><script>track()</script><style>p{}</style><form><input></form><iframe src="x"></iframe>',
      BASE,
    );
    expect(body).toBe('<p>Keep</p>');
  });

  it('keeps links and pictures, read against the post, and nothing that is not the web', () => {
    const body = toXhtmlBody(
      '<a href="/about" onclick="x()" class="c">About</a><a href="javascript:alert(1)">Bad</a><img src="a.jpg" alt="A" width="600">',
      BASE,
    );
    expect(body).toBe(
      '<a href="https://blog.example.com/about">About</a><a>Bad</a><img src="https://blog.example.com/2024/post/a.jpg" alt="A"/>',
    );
  });

  it('finds the real picture behind lazy loading, and drops inline data images', () => {
    expect(toXhtmlBody('<img src="data:image/gif;base64,AA" data-src="/real.jpg">', BASE)).toBe(
      '<img src="https://blog.example.com/real.jpg"/>',
    );
    expect(toXhtmlBody('<img srcset="/small.jpg 400w, /big.jpg 800w">', BASE)).toBe(
      '<img src="https://blog.example.com/small.jpg"/>',
    );
    expect(toXhtmlBody('<img src="data:image/png;base64,AA">', BASE)).toBe('');
  });

  it('keeps footnote targets and in-page links', () => {
    const body = toXhtmlBody('<sup><a href="#fn1">1</a></sup><li id="fn1">Note</li><p id="1bad">x</p>', BASE);
    expect(body).toBe('<sup><a href="#fn1">1</a></sup><li id="fn1">Note</li><p>x</p>');
  });

  it('turns page structure into plain blocks and unwraps unknown tags', () => {
    expect(toXhtmlBody('<section><font color="red">Hi</font></section>', BASE)).toBe('<div>Hi</div>');
  });

  it('removes characters XML cannot hold', () => {
    const body = toXhtmlBody('<p>a\u0001b\u000Bc</p>', BASE);
    expect(body).toBe('<p>abc</p>');
    expect(new XMLParser().parse(`<body>${body}</body>`)).toBeTruthy();
  });
});

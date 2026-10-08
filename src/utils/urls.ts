/**
 * Web addresses, resolved and read by hand. Pure.
 *
 * React Native's `URL` does not reliably resolve a relative address against a
 * base, and feeds and web pages are full of them (`/feed.xml`,
 * `../images/cover.jpg`, `//cdn.example.com/a.png`).
 */

const ABSOLUTE = /^[a-z][a-z\d+.-]*:/i;

/** The scheme and host of an absolute address: `https://example.com`. */
export function originOf(url: string): string | null {
  const match = url.match(/^([a-z][a-z\d+.-]*:\/\/[^/?#]+)/i);
  return match ? match[1] : null;
}

/** The host alone, without `www.`: `example.com`. */
export function hostOf(url: string): string | null {
  const origin = originOf(url);
  if (!origin) return null;
  return origin.replace(/^[a-z][a-z\d+.-]*:\/\//i, '').replace(/^www\./i, '').replace(/:\d+$/, '').toLowerCase();
}

function normalizePath(path: string): string {
  const out: string[] = [];
  for (const segment of path.split('/')) {
    if (segment === '..') out.pop();
    else if (segment !== '.') out.push(segment);
  }
  return out.join('/');
}

/**
 * `href` as an absolute address, read against `base`. Returns `href` itself
 * when it is already absolute (including `data:` and `mailto:`), and null
 * when it is relative and there is no absolute base to read it against.
 */
export function resolveUrl(href: string, base: string | null | undefined): string | null {
  const value = href.trim();
  if (!value) return null;
  if (ABSOLUTE.test(value)) return value;
  if (!base) return null;
  const origin = originOf(base);
  if (!origin) return null;
  if (value.startsWith('//')) return `${origin.split('//')[0]}${value}`;
  if (value.startsWith('#') || value.startsWith('?')) {
    const stem = base.split(value[0] === '#' ? '#' : /[?#]/)[0];
    return `${stem}${value}`;
  }
  if (value.startsWith('/')) return `${origin}${normalizePath(value)}`;
  const basePath = base.slice(origin.length).split(/[?#]/)[0] || '/';
  const dir = basePath.slice(0, basePath.lastIndexOf('/') + 1);
  return `${origin}${normalizePath(`${dir}${value}`)}`;
}

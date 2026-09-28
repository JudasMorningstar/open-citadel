/**
 * The whole post, for feeds that carry only a summary.
 *
 * Many blogs publish the first paragraph and a "Continue reading" link, so a
 * reader who opened the post would get the teaser. When the feed's copy looks
 * like that, the post's own page is read and the article pulled out of it with
 * Mozilla's Readability (Firefox's Reader View), the same idea as Read You's
 * full-content option. Read You asks the reader to turn it on per blog; here
 * it happens when the feed's copy is too thin to read, and never otherwise.
 *
 * Readability and its DOM (linkedom) are large, so they load on first use,
 * not with the app.
 */
import { htmlToText } from '@/services/blogs/feed/text';

/** Under this much text, a feed's copy is a teaser rather than a post. */
const TEASER_CHARS = 1200;
const TEASER_ENDINGS = /(…|\.\.\.|\[…\]|continue reading|read more|read the rest)[\s\S]{0,40}$/i;

/** Whether the feed's copy is too short, or too obviously cut off, to be the post. Pure. */
export function isTeaser(contentHtml: string | null): boolean {
  if (!contentHtml) return true;
  const text = htmlToText(contentHtml);
  return text.length < TEASER_CHARS || TEASER_ENDINGS.test(text);
}

/**
 * The article inside a web page, as HTML, or null when Readability finds
 * nothing that reads like one (a home page, a paywall notice). Takes the
 * page's own HTML; fetching it is the caller's.
 */
export async function extractArticle(pageHtml: string): Promise<string | null> {
  const [{ Readability }, { parseHTML }] = await Promise.all([import('@mozilla/readability'), import('linkedom')]);
  const { document } = parseHTML(pageHtml);
  const article = new Readability(document as unknown as Document, { charThreshold: 400 }).parse();
  const content = article?.content?.trim();
  return content && htmlToText(content).length >= TEASER_CHARS / 2 ? content : null;
}

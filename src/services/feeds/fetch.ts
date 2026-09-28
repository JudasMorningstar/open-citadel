/**
 * Fetching a feed, politely. Shared by podcasts and blogs.
 *
 * A refresh of fifty feeds every few hours is fifty requests to other people's
 * servers, most of which have nothing new. So, like AntennaPod, every fetch
 * after the first sends back the validator the server gave last time
 * (`If-None-Match` for an ETag, `If-Modified-Since` for a date) and a server
 * with nothing new answers 304 with no body.
 */

const TIMEOUT_MS = 20_000;
const USER_AGENT = "OpenCitadel/1.0 (+https://www.open-citadel.online)";

export type FeedFetchResult =
  | { status: "not-modified" }
  /** `url` is where the feed ended up after any redirects: the base for its relative links. */
  | { status: "ok"; xml: string; validator: string | null; url: string };

export class FeedFetchError extends Error {}

function looksLikeDate(value: string): boolean {
  return /^[A-Za-z]{3},/.test(value);
}

/** A readable reason for a failed fetch, for the line under a feed's name. */
function describeStatus(status: number): string {
  if (status === 401 || status === 403) return "This feed is private or needs a login.";
  if (status === 404 || status === 410) return "This feed is no longer at this address.";
  if (status >= 500) return "The feed's server is having trouble. It will be tried again later.";
  return `The feed could not be loaded (error ${status}).`;
}

/** A GET with the app's user agent, a timeout, and the caller's cancellation if it has one. */
async function request(url: string, headers: Record<string, string>, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel);
  try {
    return await fetch(url, { headers: { "User-Agent": USER_AGENT, ...headers }, signal: controller.signal });
  } catch {
    throw new FeedFetchError(
      signal?.aborted ? "Cancelled." : "Could not reach this address. Check your connection.",
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}

export async function fetchFeed(url: string, validator?: string | null, signal?: AbortSignal): Promise<FeedFetchResult> {
  const headers: Record<string, string> = {
    Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5",
  };
  if (validator) {
    if (looksLikeDate(validator)) headers["If-Modified-Since"] = validator;
    else headers["If-None-Match"] = validator;
  }

  const response = await request(url, headers, signal);
  if (response.status === 304) return { status: "not-modified" };
  if (!response.ok) throw new FeedFetchError(describeStatus(response.status));
  const xml = await response.text();
  return {
    status: "ok",
    xml,
    validator: response.headers.get("etag") ?? response.headers.get("last-modified"),
    url: response.url || url,
  };
}

/**
 * A web page, for finding a site's feed or reading a post in full. `url` is
 * where it ended up after redirects.
 */
export async function fetchPage(url: string, signal?: AbortSignal): Promise<{ body: string; url: string }> {
  const response = await request(url, { Accept: "text/html, application/xhtml+xml, */*;q=0.8" }, signal);
  if (!response.ok) throw new FeedFetchError(describeStatus(response.status));
  return { body: await response.text(), url: response.url || url };
}

/**
 * What someone pasted, as a feed address: trims it, adds the scheme people
 * leave off, and turns the `feed://` / `pcast://` / `podcast://` links some
 * sites still use into plain https. Pure.
 */
export function normalizeFeedUrl(input: string): string {
  let url = input.trim();
  url = url.replace(/^(feed|pcast|podcast|itpc):\/\//i, "https://");
  url = url.replace(/^(feed|pcast|podcast):/i, "");
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url;
}

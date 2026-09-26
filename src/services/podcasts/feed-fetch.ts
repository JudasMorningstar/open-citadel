/**
 * Fetching a feed, politely.
 *
 * A refresh of fifty shows every few hours is fifty requests to other people's
 * servers, most of which have nothing new. So, like AntennaPod, every fetch
 * after the first sends back the validator the server gave last time
 * (`If-None-Match` for an ETag, `If-Modified-Since` for a date) and a server
 * with nothing new answers 304 with no body.
 */

const TIMEOUT_MS = 20_000;
const USER_AGENT = "OpenCitadel/1.0 (podcasts; +https://opencitadel.app)";

export type FeedFetchResult =
  | { status: "not-modified" }
  | { status: "ok"; xml: string; validator: string | null };

export class FeedFetchError extends Error {}

function looksLikeDate(value: string): boolean {
  return /^[A-Za-z]{3},/.test(value);
}

/** A readable reason for a failed fetch, for the line under a show's name. */
function describeStatus(status: number): string {
  if (status === 401 || status === 403) return "This feed is private or needs a login.";
  if (status === 404 || status === 410) return "This feed is no longer at this address.";
  if (status >= 500) return "The podcast's server is having trouble. It will be tried again later.";
  return `The feed could not be loaded (error ${status}).`;
}

export async function fetchFeed(url: string, validator?: string | null): Promise<FeedFetchResult> {
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5",
  };
  if (validator) {
    if (looksLikeDate(validator)) headers["If-Modified-Since"] = validator;
    else headers["If-None-Match"] = validator;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, { headers, signal: controller.signal });
  } catch {
    throw new FeedFetchError("Could not reach this feed. Check your connection.");
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 304) return { status: "not-modified" };
  if (!response.ok) throw new FeedFetchError(describeStatus(response.status));
  const xml = await response.text();
  return {
    status: "ok",
    xml,
    validator: response.headers.get("etag") ?? response.headers.get("last-modified"),
  };
}

/**
 * What someone pasted, as a feed address: trims it, adds the scheme people
 * leave off, and turns the `feed://` / `pcast://` / `podcast://` links some
 * sites still use into plain https.
 */
export function normalizeFeedUrl(input: string): string {
  let url = input.trim();
  url = url.replace(/^(feed|pcast|podcast|itpc):\/\//i, "https://");
  url = url.replace(/^(feed|pcast|podcast):/i, "");
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url;
}

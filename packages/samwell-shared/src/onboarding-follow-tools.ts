import { toolDefinition } from '@tanstack/ai/client';
import { z } from 'zod';

/**
 * Podcasts and blogs, for the first run: finding a few that fit what the
 * reader said, and following them.
 *
 * Kept beside `onboarding-tools` rather than inside it, and joined into its
 * catalogue there, so `ONBOARDING_TOOL_DEFINITIONS` is still the one list the
 * route sends.
 *
 * The same shape the free books have. The model is only ever handed ids, and
 * the device resolves an id against what it actually showed him: a show from
 * the last searches, a blog from the directory. Nothing he invents becomes a
 * feed this app goes and fetches.
 *
 * A blog's id is a slug of its name rather than its place in the list, so a
 * conversation resumed after an update that reshuffled the directory still
 * follows the blog he named.
 */

/** The tools only a build with podcasts and blogs can run. */
export const ONBOARDING_FEED_TOOL_NAMES: ReadonlySet<string> = new Set([
  'find_podcasts',
  'follow_podcasts',
  'list_blogs',
  'follow_blogs',
]);

export const FindPodcastsInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(120)
    .describe(
      "What to search Apple's podcast directory for: a subject ('stoicism', 'startup founders', 'habits and productivity') or a show's own name when they named one. Keywords, not their sentence. You may call this more than once with different words.",
    ),
});

export const PodcastCandidateSchema = z.object({
  /** Apple's id for the show. What `follow_podcasts` takes. */
  id: z.number(),
  title: z.string(),
  author: z.string().nullable(),
});

export const FindPodcastsOutputSchema = z.object({
  candidates: z.array(PodcastCandidateSchema),
  formatted: z.string(),
  error: z.string().optional(),
});

/** What following did, for either kind. */
export const FollowFeedsOutputSchema = z.object({
  ok: z.boolean(),
  /** The names of what is now followed. */
  followed: z.array(z.string()),
  /** What could not be followed, by name, and why. */
  failed: z.array(z.object({ name: z.string(), error: z.string() })),
  error: z.string().optional(),
});

export const FollowPodcastsInputSchema = z.object({
  podcast_ids: z
    .array(z.number())
    .min(1)
    .max(3)
    .describe('The ids of the shows to follow, from find_podcasts. At most three.'),
});

export const ListBlogsInputSchema = z.object({});

export const ListBlogsOutputSchema = z.object({
  formatted: z.string(),
});

export const FollowBlogsInputSchema = z.object({
  blog_ids: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("The ids of the blogs to follow, exactly as list_blogs gives them ('james-clear'). At most three."),
});

export const findPodcastsTool = toolDefinition({
  name: 'find_podcasts',
  description:
    "Search Apple's podcast directory for shows matching a subject or a show's name. Returns candidates only; it follows nothing. Call this after they have told you what they care about, or named a show they already listen to. Read the results and choose the ones that genuinely fit, rather than the first ones back.",
  inputSchema: FindPodcastsInputSchema,
  outputSchema: FindPodcastsOutputSchema,
});

export const followPodcastsTool = toolDefinition({
  name: 'follow_podcasts',
  description:
    "Follow up to three shows found by find_podcasts, so they appear on the Podcasts side of the user's Library with their newest episode ready. Nothing is downloaded. Tell them which shows you picked and why before calling this. Requires user approval.",
  inputSchema: FollowPodcastsInputSchema,
  outputSchema: FollowFeedsOutputSchema,
  needsApproval: true,
});

export const listBlogsTool = toolDefinition({
  name: 'list_blogs',
  description:
    'The blogs Open Citadel recommends, by section, each with an id and one line on what it is. This is the whole list and there is no search, so call it once. Choose from it the ones that genuinely fit what they told you.',
  inputSchema: ListBlogsInputSchema,
  outputSchema: ListBlogsOutputSchema,
});

export const followBlogsTool = toolDefinition({
  name: 'follow_blogs',
  description:
    "Follow up to three blogs from list_blogs, so their posts appear on the Blogs side of the user's Library. Tell them which blogs you picked and why before calling this. Requires user approval.",
  inputSchema: FollowBlogsInputSchema,
  outputSchema: FollowFeedsOutputSchema,
  needsApproval: true,
});

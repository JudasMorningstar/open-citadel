/**
 * `find_podcasts` and `follow_podcasts`: a few shows that fit what the reader
 * said, from Apple's directory, the same one Explore searches.
 */
import { searchShows } from '@/services/podcasts/discovery';
import { followDiscoveredShow } from '@/services/podcasts/actions';
import {
  followOutcome,
  formatPodcastCandidates,
  PODCAST_CANDIDATE_LIMIT,
  type FollowResult,
} from '@/services/onboarding-tools/format';
import { podcastShortlist, type PodcastPick } from '@/services/onboarding-tools/shortlist';
import { libraryReady } from '@/services/onboarding-tools/library-ready';
import { usePodcastPrefs } from '@/stores/podcast-prefs';

export async function runFindPodcasts(input: { query: string }): Promise<{
  candidates: { id: number; title: string; author: string | null }[];
  formatted: string;
  error?: string;
}> {
  try {
    const found = await searchShows(input.query);
    // Apple's id is what he is handed, so a show without one cannot be picked.
    const shows: PodcastPick[] = found
      .filter((show) => show.appleId && show.feedUrl)
      .slice(0, PODCAST_CANDIDATE_LIMIT)
      .map((show) => ({
        id: Number(show.appleId),
        title: show.title,
        author: show.author,
        feedUrl: show.feedUrl!,
      }));
    podcastShortlist.hold(shows);
    return {
      candidates: shows.map(({ id, title, author }) => ({ id, title, author })),
      formatted: formatPodcastCandidates(input.query, shows),
    };
  } catch (error) {
    console.warn('[onboarding] find_podcasts failed:', error);
    return {
      candidates: [],
      formatted: '',
      error:
        'Could not reach the podcast directory. Tell them they can find shows later from Explore on the Podcasts side of the Library.',
    };
  }
}

export async function runFollowPodcasts(input: { podcast_ids: number[] }): Promise<FollowResult> {
  const chosen = podcastShortlist.pick(input.podcast_ids);
  if (chosen.length === 0) {
    return {
      ok: false,
      followed: [],
      failed: [],
      error: 'None of those ids came from find_podcasts. Search first and choose from what it returns.',
    };
  }

  const settled = await Promise.allSettled(
    chosen.map((show) => followDiscoveredShow({ appleId: String(show.id), feedUrl: show.feedUrl })),
  );
  const outcome = followOutcome(chosen, settled, (show) => show.title);
  if (outcome.failed.length > 0) console.warn('[onboarding] follow_podcasts failures:', outcome.failed);

  if (outcome.ok) {
    // They have met Podcasts now, by way of Samwell rather than its welcome.
    const prefs = usePodcastPrefs.getState();
    if (prefs.onboarding === 'pending') prefs.set('onboarding', 'fresh');
    libraryReady();
  }
  return outcome;
}

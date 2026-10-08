import { describe, expect, it } from 'vitest';

import {
  onboardingClientToolDefinitions,
  onboardingSetupNotes,
  onboardingSystemPrompt,
  ONBOARDING_FEEDS_PROP,
  readOnboardingFeeds,
} from '../index';

const names = (feeds: boolean) => onboardingClientToolDefinitions({ feeds }).map((tool) => tool.name);

describe('onboarding for a build with podcasts and blogs', () => {
  it('is only switched on by the flag itself', () => {
    expect(readOnboardingFeeds({ [ONBOARDING_FEEDS_PROP]: true })).toBe(true);
    expect(readOnboardingFeeds({ [ONBOARDING_FEEDS_PROP]: 'true' })).toBe(false);
    expect(readOnboardingFeeds({})).toBe(false);
    expect(readOnboardingFeeds(undefined)).toBe(false);
  });

  it('offers the podcast and blog tools', () => {
    expect(names(true)).toEqual(
      expect.arrayContaining(['find_podcasts', 'follow_podcasts', 'list_blogs', 'follow_blogs']),
    );
  });

  it('carries the podcasts and blogs step and the three-sided guide', () => {
    const prompt = onboardingSystemPrompt({ feeds: true });
    expect(prompt).toContain('**Podcasts and blogs.**');
    expect(prompt).toContain('4. **End it with `finish_onboarding`.**');
    expect(prompt).toContain('Done in this conversation');
    expect(prompt).toContain('Never ask whether to go ahead');
    expect(prompt).toContain('**Podcasts.** Shows they follow');
    expect(prompt).not.toContain('${');
  });
});

describe('onboarding for an older build', () => {
  it('never offers tools it has no code for', () => {
    const tools = names(false);
    for (const name of ['find_podcasts', 'follow_podcasts', 'list_blogs', 'follow_blogs']) {
      expect(tools).not.toContain(name);
    }
    expect(tools).toContain('download_free_books');
    expect(tools).toContain('finish_onboarding');
  });

  it('keeps the finish it knows, with no goodbye argument', () => {
    const finish = (feeds: boolean) =>
      onboardingClientToolDefinitions({ feeds }).find((tool) => tool.name === 'finish_onboarding');
    expect(JSON.stringify(finish(false)?.inputSchema)).not.toContain('goodbye');
    expect(JSON.stringify(finish(true)?.inputSchema)).toContain('goodbye');
  });

  it('is the books-only script, with its steps closed up', () => {
    const prompt = onboardingSystemPrompt({ feeds: false });
    expect(prompt).not.toContain('find_podcasts');
    expect(prompt).not.toContain('**Podcasts.** Shows they follow');
    expect(prompt).toContain('blogs and podcasts are coming');
    expect(prompt).toContain('4. **Say where to find you');
    expect(prompt).toContain('go to step 3.');
    expect(prompt).not.toContain('Done in this conversation');
  });
});

describe('onboardingSetupNotes', () => {
  it('names no step numbers, which differ between the two scripts', () => {
    const notes = onboardingSetupNotes({ name: 'Jason', platform: 'android', hasLibrary: true });
    expect(notes).not.toMatch(/step \d/);
  });
});

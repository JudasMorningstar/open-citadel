import type { UIMessage } from '@tanstack/ai-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createReplySequence, replySegments } from '@/services/reply-sequence';
import { createSmoothReveal } from '@/services/smooth-reveal';

type Part = UIMessage['parts'][number];
const text = (content: string): Part => ({ type: 'text', content });
const call = (name: string): Part =>
  ({ type: 'tool-call', id: name, name, arguments: '{}', state: 'input-complete' }) as Part;
const message = (role: UIMessage['role'], parts: Part[]): UIMessage => ({
  id: `${role}-${Math.random()}`,
  role,
  parts,
});

describe('replySegments', () => {
  it('splits his reply at each tool call, since the reader last spoke', () => {
    expect(
      replySegments([
        message('assistant', [text('Before you spoke.')]),
        message('user', [text('Podcasts please.')]),
        message('assistant', [text('Let me look.'), call('find_podcasts')]),
        message('assistant', [text('Here are three.'), call('follow_podcasts')]),
        message('assistant', [text('Done. Now blogs')]),
      ]),
    ).toEqual(['Let me look.', 'Here are three.', 'Done. Now blogs']);
  });

  it('leaves an empty stretch where nothing was said between calls', () => {
    expect(
      replySegments([
        message('user', [text('Hi')]),
        message('assistant', [call('list_blogs'), call('follow_blogs')]),
      ]),
    ).toEqual(['', '', '']);
  });
});

describe('createReplySequence', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('hands over each finished stretch once shown, and shows the next after it', async () => {
    const events: string[] = [];
    const reveal = createSmoothReveal((shown) => events.push(`show:${shown}`));
    const sequence = createReplySequence({ reveal, onPart: (part) => events.push(`part:${part}`) });

    sequence.update(['Let me look for a few shows.']);
    sequence.update(['Let me look for a few shows.', 'Here']);
    sequence.update(['Let me look for a few shows.', 'Here are three.']);
    await vi.runAllTimersAsync();
    await sequence.idle();

    const part = events.indexOf('part:Let me look for a few shows.');
    const next = events.findIndex((event) => event.startsWith('show:Here'));
    expect(events[part - 1]).toBe('show:Let me look for a few shows.');
    expect(next).toBeGreaterThan(part);
    expect(events.at(-1)).toBe('show:Here are three.');
    expect(sequence.current()).toBe('Here are three.');
  });

  it('runs what follows the words only after they have all arrived', async () => {
    const events: string[] = [];
    const reveal = createSmoothReveal((shown) => events.push(`show:${shown}`));
    const sequence = createReplySequence({ reveal });

    sequence.update(['I picked three blogs for you.']);
    sequence.then(() => events.push('card'));
    await vi.runAllTimersAsync();

    expect(events.at(-1)).toBe('card');
    expect(events.at(-2)).toBe('show:I picked three blogs for you.');
  });

  it('keeps one growing bubble when the surface wants no parts', async () => {
    const reveal = createSmoothReveal(() => {});
    const sequence = createReplySequence({ reveal });
    sequence.update(['Let me look.', 'Here are three.']);
    expect(sequence.current()).toBe('Let me look.\n\nHere are three.');
  });
});

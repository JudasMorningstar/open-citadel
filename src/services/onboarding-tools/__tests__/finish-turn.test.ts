import type { UIMessage } from '@tanstack/ai-client';
import { describe, expect, it } from 'vitest';

import { finishTurn } from '@/services/onboarding-tools/finish-turn';

type Part = UIMessage['parts'][number];

const text = (content: string): Part => ({ type: 'text', content });
const call = (name: string, extra: Record<string, unknown> = {}): Part =>
  ({ type: 'tool-call', id: `${name}-id`, name, arguments: '{}', state: 'input-complete', ...extra }) as Part;
const message = (role: UIMessage['role'], parts: Part[]): UIMessage => ({
  id: `${role}-${Math.random()}`,
  role,
  parts,
});

describe('finishTurn', () => {
  it('reads only what he said after his last other tool call', () => {
    const turn = finishTurn([
      message('user', [text('Sure, blogs too.')]),
      message('assistant', [
        text('Here are three blogs. Want these?'),
        call('follow_blogs', { output: { ok: true } }),
      ]),
      message('assistant', [text('All set. Enjoy them.'), call('finish_onboarding')]),
    ]);
    expect(turn).toEqual({ said: 'All set. Enjoy them.', openCalls: [] });
  });

  it('keeps the question when it came after the last call', () => {
    const turn = finishTurn([
      message('user', [text('Hi')]),
      message('assistant', [text('Shall I find you some podcasts?'), call('finish_onboarding')]),
    ]);
    expect(turn.said).toBe('Shall I find you some podcasts?');
  });

  it('ignores anything before the reader last spoke', () => {
    const turn = finishTurn([
      message('assistant', [text('Want podcasts?')]),
      message('user', [text('No thanks.')]),
      message('assistant', [call('finish_onboarding')]),
    ]);
    expect(turn.said).toBe('');
  });

  it('names a call still waiting on the reader, alongside the finish', () => {
    const turn = finishTurn([
      message('user', [text('Yes')]),
      message('assistant', [
        call('follow_podcasts', {
          state: 'approval-requested',
          approval: { id: 'a', needsApproval: true },
        }),
        call('finish_onboarding'),
      ]),
    ]);
    expect(turn.openCalls).toEqual(['follow_podcasts']);
  });

  it('does not wait on a call that was declined', () => {
    const turn = finishTurn([
      message('user', [text('Yes')]),
      message('assistant', [
        call('follow_blogs', {
          state: 'approval-responded',
          approval: { id: 'a', needsApproval: true, approved: false },
        }),
        call('finish_onboarding'),
      ]),
    ]);
    expect(turn.openCalls).toEqual([]);
  });
});

import { ChatClient, clientTools, stream } from '@tanstack/ai-client';
import { finishOnboardingTool, followBlogsTool } from 'samwell-shared';
import { describe, expect, it } from 'vitest';

/*
 * What `finish_onboarding` relies on in the ChatClient: a client tool that
 * never returns ends the turn with no request after it, and does not hold up
 * the call that brought it in. Pinned here because a library upgrade could
 * change either, and the first would cost the house a model call per goodbye
 * while the second would leave onboarding stuck.
 */

const at = Date.now();

function toolCall(runId: string, id: string, name: string, input: unknown, after: unknown) {
  return [
    { type: 'RUN_STARTED', runId, threadId: 't', timestamp: at },
    { type: 'TOOL_CALL_START', toolCallId: id, toolName: name, toolCallName: name, timestamp: at },
    { type: 'TOOL_CALL_ARGS', toolCallId: id, delta: JSON.stringify(input), timestamp: at },
    { type: 'TOOL_CALL_END', toolCallId: id, input, timestamp: at },
    { type: 'RUN_FINISHED', runId, threadId: 't', finishReason: 'tool_calls', timestamp: at },
    after,
  ];
}

const finishCall = (runId: string) =>
  toolCall(runId, 'finish', 'finish_onboarding', { goodbye: 'Enjoy.' }, {
    type: 'CUSTOM',
    name: 'tool-input-available',
    value: { toolCallId: 'finish', toolName: 'finish_onboarding', input: { goodbye: 'Enjoy.' } },
    timestamp: at,
  });

function setUp(runs: unknown[][]) {
  let requests = 0;
  let finished = false;
  const client = new ChatClient({
    connection: stream(async function* () {
      const run = runs[requests] ?? [];
      requests += 1;
      for (const chunk of run) yield chunk as never;
    }),
    tools: clientTools(
      followBlogsTool.client(async () => ({ ok: true, followed: [], failed: [] })),
      finishOnboardingTool.client(async () => {
        finished = true;
        return new Promise<never>(() => {});
      }),
    ),
  });
  return { client, requests: () => requests, finished: () => finished };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

describe('a finish tool that never returns', () => {
  it('ends the first reply with no request after it', async () => {
    const chat = setUp([finishCall('r1')]);
    await chat.client.sendMessage('Thanks, that is all.');
    await settle();
    expect(chat.finished()).toBe(true);
    expect(chat.requests()).toBe(1);
    chat.client.dispose();
  });

  it('ends a continuation after a card without holding up the answer', async () => {
    const card = toolCall('r1', 'blogs', 'follow_blogs', { blog_ids: ['x'] }, {
      type: 'CUSTOM',
      name: 'approval-requested',
      value: {
        toolCallId: 'blogs',
        toolName: 'follow_blogs',
        input: { blog_ids: ['x'] },
        approval: { id: 'card', needsApproval: true },
      },
      timestamp: at,
    });
    const chat = setUp([card, finishCall('r2')]);
    await chat.client.sendMessage('Blogs too.');
    await settle();
    await chat.client.addToolApprovalResponse({ id: 'card', approved: false });
    await settle();
    expect(chat.finished()).toBe(true);
    expect(chat.requests()).toBe(2);
    chat.client.dispose();
  });
});

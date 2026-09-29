import type { UIMessage } from '@tanstack/ai-client';

/** What `finish_onboarding` checks before it lets a goodbye end things. */
export type FinishTurn = {
  /**
   * What he has said since his last other tool call. Not the whole turn: a
   * question he asked before a card ("want these?") was answered by the card,
   * and must not block the goodbye that comes after it.
   */
  said: string;
  /**
   * His other calls in this message that have not finished, whether waiting
   * on the reader's go-ahead or still running. A goodbye made alongside them
   * would describe work that may never happen.
   */
  openCalls: string[];
};

const FINISH = 'finish_onboarding';

type ToolCall = Extract<UIMessage['parts'][number], { type: 'tool-call' }>;

function isOpen(part: ToolCall, results: Set<string>): boolean {
  if (part.output !== undefined || results.has(part.id)) return false;
  if (part.state === 'complete' || part.state === 'error') return false;
  // Declined: nothing will run.
  return !(part.state === 'approval-responded' && part.approval?.approved === false);
}

export function finishTurn(messages: UIMessage[]): FinishTurn {
  let start = messages.length;
  while (start > 0 && messages[start - 1]?.role !== 'user') start -= 1;
  const turn = messages.slice(start).filter((message) => message.role === 'assistant');

  const said: string[] = [];
  for (const message of turn) {
    for (const part of message.parts) {
      if (part.type === 'text' && part.content.trim()) said.push(part.content.trim());
      else if (part.type === 'tool-call' && part.name !== FINISH) said.length = 0;
    }
  }

  const last = turn.at(-1);
  const results = new Set(
    last?.parts.flatMap((part) => (part.type === 'tool-result' ? [part.toolCallId] : [])) ?? [],
  );
  const openCalls =
    last?.parts.flatMap((part) =>
      part.type === 'tool-call' && part.name !== FINISH && isOpen(part, results) ? [part.name] : [],
    ) ?? [];

  return { said: said.join('\n\n'), openCalls };
}

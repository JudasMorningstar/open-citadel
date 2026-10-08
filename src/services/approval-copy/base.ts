/**
 * The shape every approval is worded in, and the helpers that read a tool
 * call's input. Shared by `approval-copy` and onboarding's own wording
 * (`onboarding-tools/approval`), so the two cannot drift apart on either.
 */

export type ApprovalCopy = {
  title: string;
  body: string;
  confirmLabel: string;
  destructive: boolean;
};

export function approve(title: string, body: string): ApprovalCopy {
  return { title, body, confirmLabel: 'APPROVE', destructive: false };
}

/** One field of a tool call's input, whatever it is. */
export function field(input: unknown, key: string): unknown {
  return input && typeof input === 'object' ? (input as Record<string, unknown>)[key] : undefined;
}

export function stringField(input: unknown, key: string): string | undefined {
  const value = field(input, key);
  return typeof value === 'string' ? value : undefined;
}

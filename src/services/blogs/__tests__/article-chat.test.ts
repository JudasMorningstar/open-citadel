import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/book-context', () => ({ extractReadText: vi.fn() }));

const { ARTICLE_CONTEXT_CHARS, articleChatPrompt } = await import('@/services/blogs/article-chat');

describe('articleChatPrompt', () => {
  it('names the post and its writer, with no reading boundary', () => {
    const prompt = articleChatPrompt('On Attention', 'Ada Writer, Example Essays', 'Attention is a budget.');
    expect(prompt).toContain('"On Attention" by Ada Writer, Example Essays');
    expect(prompt).toContain('Attention is a budget.');
    expect(prompt).not.toMatch(/has read|beyond that point/);
  });

  it('says when the post was cut to fit', () => {
    const long = 'x'.repeat(ARTICLE_CONTEXT_CHARS + 10);
    const prompt = articleChatPrompt('T', 'A', long);
    expect(prompt).toContain('it continues past this point');
    expect(prompt.endsWith('x'.repeat(ARTICLE_CONTEXT_CHARS))).toBe(true);
  });

  it('still introduces the post when its text cannot be read', () => {
    expect(articleChatPrompt('T', 'A', null)).toBe(
      'You are discussing the blog post "T" by A. Help the user understand it, question it, and apply it. Be concise and insightful.',
    );
  });
});

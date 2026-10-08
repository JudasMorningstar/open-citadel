/**
 * Samwell on a blog post: how a chat started from a post is grounded.
 *
 * A book chat is held to what has been read, because a book has a plot to
 * spoil. A post has none, and is short enough to give him whole, so a chat
 * about one is grounded in the post itself, from the top.
 */
import { extractReadText } from '@/services/book-context';

/**
 * How much of a post goes into his context. About fifteen hundred tokens:
 * room for a long essay's argument, with space left for the conversation on
 * the smallest on-device model.
 */
export const ARTICLE_CONTEXT_CHARS = 6000;

/** The post's text, from its reader copy. Null when the copy cannot be read. */
export async function articleText(filePath: string): Promise<string | null> {
  try {
    const text = (await extractReadText(filePath, null, ARTICLE_CONTEXT_CHARS + 1)).trim();
    return text || null;
  } catch {
    return null;
  }
}

/** The opening instruction for a chat about a whole post. Pure. */
export function articleChatPrompt(title: string, author: string, text: string | null): string {
  const intro = `You are discussing the blog post "${title}" by ${author}. Help the user understand it, question it, and apply it. Be concise and insightful.`;
  if (!text) return intro;
  const cut = text.length > ARTICLE_CONTEXT_CHARS;
  return `${intro}\n\nHere is the post${cut ? ' (it continues past this point)' : ''}:\n\n${text.slice(0, ARTICLE_CONTEXT_CHARS)}`;
}

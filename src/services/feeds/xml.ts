/** Reading the objects fast-xml-parser hands back: text, attributes and links, however they came. */

export type Node = Record<string, unknown>;

export function isNode(value: unknown): value is Node {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The text of an element, whether it came back bare or with attributes beside it. */
export function text(value: unknown): string | null {
  if (value == null) return null;
  if (Array.isArray(value)) return text(value[0]);
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  if (isNode(value) && "#text" in value) return text(value["#text"]);
  return null;
}

export function attr(value: unknown, name: string): string | null {
  if (Array.isArray(value)) return attr(value[0], name);
  if (!isNode(value)) return null;
  const raw = value[`@_${name}`];
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

export function firstLink(value: unknown): string | null {
  // RSS channels often carry an `atom:link rel="self"` alongside their own
  // `<link>`, and some feeds repeat `<link>`: take the first plain one.
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = firstLink(entry);
      if (found) return found;
    }
    return null;
  }
  return text(value) ?? attr(value, "href");
}

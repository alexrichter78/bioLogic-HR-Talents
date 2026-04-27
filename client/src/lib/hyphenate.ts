// @ts-expect-error - no type definitions available for hypher
import Hypher from "hypher";
// @ts-expect-error - no type definitions available for hyphenation.de
import german from "hyphenation.de";

const hypher = new (Hypher as any)(german);

export function hyphenateText(text: string): string {
  try {
    return text.replace(/\S{6,}/g, (word) => {
      const parts: string[] = hypher.hyphenate(word);
      return parts.join("\u00AD");
    });
  } catch {
    return text;
  }
}

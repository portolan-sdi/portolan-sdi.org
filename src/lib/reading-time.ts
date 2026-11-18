/**
 * The reading time of a post, from its MDX source.
 *
 * The count leaves out what a reader does not read as prose: the import
 * lines, the component tags with their props, and the link targets. Code in
 * a fenced block counts, because a reader does read it.
 */

/** Words per minute. A common figure for technical prose on a screen. */
const WORDS_PER_MINUTE = 230;

/** The number of words that a reader reads in an MDX source. */
export function countWords(source: string): number {
  const prose = source
    // Import lines at the head of the file.
    .replace(/^import\s.*$/gm, " ")
    // Component tags, which can run over many lines, with their props.
    .replace(/<[A-Za-z/][^>]*>/g, " ")
    // A link keeps its text and loses its target.
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // Fence lines and heading marks are not words.
    .replace(/^(```.*|#+\s)/gm, " ");
  return prose.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/** Whole minutes, rounded up, and never less than 1. */
export function readingMinutes(source: string): number {
  return Math.max(1, Math.ceil(countWords(source) / WORDS_PER_MINUTE));
}

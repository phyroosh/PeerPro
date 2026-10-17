/**
 * Utilities for preparing narration text and chunking long scripts while preserving
 * meaning, sentence structure, and conversational flow.
 */

export interface TextChunk {
  index: number;
  text: string;
  charCount: number;
}

/**
 * Normalizes narration text while preserving word order, punctuation, and intent.
 */
export function normalizeNarrationText(text: string): string {
  if (!text) return '';

  return (
    text
      // Remove vertical tabs, null bytes, and non-printable control chars
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
      // Normalize various dashes to standard dash
      .replace(/[\u2013\u2014]/g, '—')
      // Normalize smart quotes to standard quotes
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      // Normalize spaces before and after newlines
      .replace(/[ \t]*\n\s*/g, '\n\n')
      // Normalize multiple consecutive spaces/tabs to a single space
      .replace(/[ \t]+/g, ' ')
      .trim()
  );
}

/**
 * Splits narration text into natural sentence boundaries.
 * Preserves sentence order without dropping any words or punctuation.
 */
export function splitIntoSentences(text: string): string[] {
  const normalized = normalizeNarrationText(text);
  if (!normalized) return [];

  // Match sentences ending in ., !, ?, or newlines, accounting for quotes
  const sentenceRegex = /[^.!?\n]+(?:[.!?]+(?:['"]|\s+|$)|(?:\n+|$))/g;
  const matches = normalized.match(sentenceRegex);

  if (!matches || matches.length === 0) {
    return [normalized];
  }

  const sentences: string[] = [];
  for (const match of matches) {
    const trimmed = match.trim();
    if (trimmed.length > 0) {
      sentences.push(trimmed);
    }
  }

  return sentences.length > 0 ? sentences : [normalized];
}

/**
 * Chunks long narration text into segments respecting a maximum character length limit.
 * Chunks are strictly broken at sentence boundaries to preserve natural inflection.
 */
export function chunkNarrationText(text: string, maxChunkChars = 800): TextChunk[] {
  const normalized = normalizeNarrationText(text);
  if (!normalized) return [];

  if (normalized.length <= maxChunkChars) {
    return [
      {
        index: 0,
        text: normalized,
        charCount: normalized.length,
      },
    ];
  }

  const sentences = splitIntoSentences(normalized);
  const chunks: TextChunk[] = [];
  let currentSegment: string[] = [];
  let currentLength = 0;

  for (const sentence of sentences) {
    // If adding this sentence exceeds limit and we already have content, flush
    if (currentSegment.length > 0 && currentLength + sentence.length + 1 > maxChunkChars) {
      const chunkText = currentSegment.join(' ');
      chunks.push({
        index: chunks.length,
        text: chunkText,
        charCount: chunkText.length,
      });
      currentSegment = [];
      currentLength = 0;
    }

    currentSegment.push(sentence);
    currentLength += sentence.length + 1;
  }

  if (currentSegment.length > 0) {
    const chunkText = currentSegment.join(' ');
    chunks.push({
      index: chunks.length,
      text: chunkText,
      charCount: chunkText.length,
    });
  }

  return chunks;
}

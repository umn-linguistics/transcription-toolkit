  import { REPLACEMENT_MARKER } from "./interfaces/constants";
  
  export function validHeaders(headers: string[], supportedHeaders: Object): string[] {
    if (headers.length < 1) {
        throw new Error('No headers found');
    }

    const supportedHeaderValues = Object.values(supportedHeaders);

    const missingHeaders: string[] = [];
    const duplicateHeaders: string[] = [];
    const validHeadersList: string[] = [];

    // Check that each supported header is in the existing headers once and only once
    for (const supportedHeader of supportedHeaderValues) {
        // Duplicate header
        if (validHeadersList.includes(supportedHeader)) {
        duplicateHeaders.push(supportedHeader);
        }
        // Missing header
        if (!headers.includes(supportedHeader)) {
        missingHeaders.push(supportedHeader);
        }
        validHeadersList.push(supportedHeader);
    }

    if (missingHeaders.length > 0) {
        throw new Error(`Worksheet is missing column(s): ${missingHeaders.join(', ')}`);
    }
    if (duplicateHeaders.length > 0) {
        throw new Error(`Worksheet has duplicate column(s): ${duplicateHeaders.join(', ')}`);
    }

    return headers;
  }

export const validateGloss = (str: string, validMorphemeTags: string[]): string => {
  // Escape special regex characters in morpheme tags
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Sort tags by length (longest first) for greedy matching
  const sortedTags = [...validMorphemeTags]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex);

  // Build regex pattern:
  // Match either a morpheme tag OR a single valid character (a-z, hyphen, period, space)
  const tagPattern = sortedTags.length > 0 ? sortedTags.join('|') + '|' : '';
  const pattern = new RegExp(`^(?:${tagPattern}[a-z\\-.  ])`);

  let result = '';
  let i = 0;

  while (i < str.length) {
    let matched = false;

    // Try to match from current position
    const remaining = str.slice(i);
    const match = remaining.match(pattern);

    if (match) {
      result += match[0];
      i += match[0].length;
      matched = true;
    }

    if (!matched) {
      result += REPLACEMENT_MARKER;
      i++;
    }
  }

  return result;
}
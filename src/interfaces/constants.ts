/**
 * Application-wide constants
 */

export const COLORS = {
  MISALIGNED: '#eb9999',
  ALIGNED: 'white',
  HEADER_BACKGROUND: '#cfe2f3'
} as const;

export const SHEET_NAMES = {
  DEFAULT_BASE: 'TranscriptSheet',
  GRAPHEME_PROFILE: 'Characters',
  MORPHEME_TAGS: 'GlossAbbreviations'
} as const;

export const MIME_TYPES = {
  PLAIN_TEXT: 'text/plain',
  CSV: 'text/csv'
} as const;

export const FILE_EXTENSIONS = {
  LATEX: '.tex',
  TEXT: '.txt',
  CSV: '.csv'
} as const;

export const COLUMN_POSITIONS = {
  FIRST: 1,
  HEADER_ROW: 1,
  FIRST_DATA_ROW: 2
} as const;

export const REPLACEMENT_MARKER = '\uFFFD'; // �

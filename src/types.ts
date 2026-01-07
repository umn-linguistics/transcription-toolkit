export interface TranscriptRow {
    id: string,
    utterance: string,
    utteranceGloss: string,
    freeTranslation: string,
    note: string,
    speaker: string,
    scribe: string,
    date: string,
    group: string,
    beginTime?: string,
    endTime?: string,
    duration?: string,
    raw?: string[]
  }

export interface Transcript {
  headers: string[],
  rows: any[] // we want to support the addition of ad hoc columns while performing checks and updates based on the column names in the TranscriptColumns enum
}

export interface Transcription {
  id: string,
  text: string
}

export interface ConcordanceRow {
    id: string,
    word: string,
    wordGloss: string,
    wordIndex: number,
    utterance: string,
    utteranceGloss: string
}

export interface ElanRow {
  beginTime: string,
  endTime: string,
  duration: string,
  id: string
}

export enum ElanColumns {
  begin_time = 'Begin Time - ss.msec',
  end_time = 'End Time - ss.msec',
  duration = 'Duration - ss.msec'
}

export enum GraphemeColumns {
  grapheme = 'character'
}

export interface Graphemes {
  headers: string[],
  rows: any[] // we want to support the addition of ad hoc columns while performing checks and updates based on the column names in the TranscriptColumns enum
}

export interface GraphemeRow {
  grapheme: string
}

export interface MorphemeRow {
  morpheme_tag: string
}

export enum MorphemeColumns {
  morpheme = 'gloss_abbreviation'
}

export interface Morphemes {
  headers: string[],
  rows: any[]
}

export enum TranscriptColumns {
  id = 'id',
  transcription = 'ipa_transcription',
  gloss = 'gloss',
  freeTranslation = 'free_translation',
  note = 'note',
  speaker = 'speaker',
  scribe = 'scribe',
  date = 'date',
  group = 'group',
  beginTime = 'begin_time',
  endTime = 'end_time',
  duration = 'duration'
}
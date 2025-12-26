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
    duration?: string
  }

export interface Transcript {
  headers: string[],
  rows: any[] // we want to support the addition of ad hoc columns while performing checks and updates based on the column names in the TranscriptColumns enum
  //headers: Map<string,number>,
  //rows: TranscriptRow[]
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

export enum GraphemeColumns {
  grapheme = 'grapheme'
}

export interface Graphemes {
  headers: string[],
  rows: any[] // we want to support the addition of ad hoc columns while performing checks and updates based on the column names in the TranscriptColumns enum
  //headers: Map<string,number>,
  //rows: TranscriptRow[]
}

export interface GraphemeRow {
  grapheme: string
}

export interface MorphemeRow {
  morpheme_tag: string
}

export enum MorphemeColumns {
  morpheme = 'morpheme_tag'
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
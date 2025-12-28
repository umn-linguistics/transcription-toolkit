import { ConcordanceRow, TranscriptColumns, TranscriptRow, GraphemeRow, Graphemes, Transcription, GraphemeColumns } from './types';
import { validHeaders } from './validators';
import { Profile } from '@enfrank/segments-js';
import type { TokenizeOptions, NormalizationForm, GraphemeSpec } from '@enfrank/segments-js';


export class Orthography {
  public graphemes: GraphemeRow[] = [];
  public headers: string[];
  public profile: Profile = new Profile([]);

  constructor(headers: string[]) {
    this.headers = validHeaders(headers, Object.values(GraphemeColumns));
  }

  public load(data: any[]) {
    const rows: GraphemeRow[] = data.map((row) => ({
        grapheme: row[this.headers.indexOf('grapheme')]
      }));
    this.graphemes = rows;
    this.setProfile();
  }

  public setProfile() {
    const graphemeList: GraphemeSpec[] = this.graphemes.map(g => {
            return {Grapheme: g.grapheme}
        });
    this.profile = new Profile(graphemeList);
  }


  // CRITICAL: Use npmBundle.Profile to ensure compatibility with npmBundle.Tokenizer
  // In Google Apps Script, both Tokenizer and Profile must come from the same bundle
  // Check if npmBundle.Profile exists (Apps Script) or fall back to imported Profile (tests)
//   const ProfileClass = (typeof npmBundle !== 'undefined' && npmBundle.Profile) ? npmBundle.Profile : Profile;
//   return new ProfileClass(graphemeList);
}
import { GraphemeRow, GraphemeColumns } from './types';
import { validHeaders } from './validators';
import { Profile } from './segments/profile';
import type { GraphemeSpec } from './segments/profile';


export class Orthography {
  public graphemes: GraphemeRow[] = [];
  public headers: string[];
  public profile: Profile = new Profile([]);

  constructor(headers: string[]) {
    this.headers = validHeaders(headers, Object.values(GraphemeColumns));
  }

  public load(data: any[]) {
    const rows: GraphemeRow[] = data
      .map((row) => ({
        grapheme: String(row[this.headers.indexOf(GraphemeColumns.grapheme)]).trim() // trim whitespace
      }))
      .filter((row) => row.grapheme !== ''); // filter out rows with only whitespace
    this.graphemes = rows;
    this.setProfile();
  }

  public setProfile() {
    const graphemeList: GraphemeSpec[] = this.graphemes.map(g => {
            return {Grapheme: g.grapheme}
        });
    this.profile = new Profile(graphemeList);
  }
}
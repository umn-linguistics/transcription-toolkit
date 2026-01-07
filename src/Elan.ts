import { ElanRow, ElanColumns } from './types';


export class Elan {
  public rows: ElanRow[] = [];
  public validMorphemeLabels: string[] = [];
  public idTier: string;

  constructor(elanIdTierName: string) {
    this.idTier = elanIdTierName;
  }

  public load(fileData: any[]) {
    const elanData: ElanRow[] = [];
    const columnMap = new Map<string, number>([
        [this.idTier, -1],
        [ElanColumns['begin_time'], -1],
        [ElanColumns['end_time'], -1],
        [ElanColumns['duration'], -1]
    ]);

    for (const row of fileData) {
        // Once all column headers are identified, start extracting data
        if (this.columnRowFound(columnMap)) {
            const beginTimeIdx = columnMap.get(ElanColumns['begin_time'])!;
            const endTimeIdx = columnMap.get(ElanColumns['end_time'])!;
            const durationIdx = columnMap.get(ElanColumns['duration'])!;
            const idIdx = columnMap.get(this.idTier)!;

            const elanRow: ElanRow = {
                beginTime: row[beginTimeIdx],
                endTime: row[endTimeIdx],
                duration: row[durationIdx],
                id: row[idIdx]
            };
            elanData.push(elanRow);
        }

        // Check if this row contains the column headers
        if (row.indexOf(this.idTier) >= 0) {
            for (const key of columnMap.keys()) {
                columnMap.set(key, row.indexOf(key));
            }
        }
    }
    this.rows = elanData;
  }

  private columnRowFound(columnMap: Map<string, number>): boolean {
    for (const key of columnMap.keys()) {
      if (columnMap.get(key) === -1) {
          return false;
      }
    }
    return true;
  }
}

import {
  MaturityPillarDefinition,
  AssessmentsPyResult,
  MaturityMatrixData,
  MaturityApplication,
} from "../../../../../shared/services/maturity-matrix";
import { LeaderApplication } from "../../../../../shared/services/maturity-matrix/model/leader-info";
import pillarsData from "../data/maturity-matrix-pillars.json";
import leaderAssociationsData from "../data/leader-application-association.json";

export const PILLARS_DEFINITIONS: MaturityPillarDefinition[] = pillarsData as MaturityPillarDefinition[];

// Map imported associations into typed LeaderApplication array
const LEADER_ASSOCIATIONS: LeaderApplication[] = (
  leaderAssociationsData as unknown as Array<{ leader: string; applications?: string[]; application?: string[] }>
).map((item) => ({
  leader: item.leader,
  application: item.applications || item.application || [],
}));

// Create a lookup map for fast application -> leader retrieval
const APP_TO_LEADER_MAP = new Map<string, string>();
for (const assoc of LEADER_ASSOCIATIONS) {
  for (const appCode of assoc.application) {
    APP_TO_LEADER_MAP.set(appCode, assoc.leader);
  }
}

export class MaturityMatrixMapper {
  /**
   * Converts raw python CSV row extracts into structured MaturityMatrixData JSON.
   */
  public static toMaturityMatrixData(pyResult: AssessmentsPyResult): MaturityMatrixData {
    const rows = pyResult.rows || [];
    const appsMap = new Map<string, MaturityApplication>();

    let currentAppCode = '';
    let currentPillarKey = '';

    for (const row of rows) {
      if (!row || row.length < 4) continue;

      const col1 = row[1]?.trim() || '';
      const col2 = row[2]?.trim() || '';
      const col3 = row[3]?.trim() || '';

      // Header row detecting Application Code and Pillar
      if (col1 && col3 && PILLARS_DEFINITIONS.some((p) => p.key === col3)) {
        currentAppCode = col1;
        currentPillarKey = col3;

        let app = appsMap.get(currentAppCode);
        if (!app) {
          app = {
            id: currentAppCode.toLowerCase().replace(/_/g, '-'),
            name: this.formatAppName(currentAppCode),
            code: currentAppCode,
            leader: APP_TO_LEADER_MAP.get(currentAppCode) || '',
            toGenerate: true,
            lastAssessmentDate: null,
            prevAssessmentDate: null,
            commentary: '',
            pillars: {},
          };

          PILLARS_DEFINITIONS.forEach((def) => {
            app!.pillars[def.key] = {
              key: def.key,
              label: def.label,
              icon: def.icon,
              assessor: '-',
              date: null,
              score: 0.0,
              level: 'Lvl 0',
              prevDate: null,
              prevScore: 0.0,
              prevLevel: 'Lvl 0',
              target: false,
              lastExtract: 0,
              prevExtract: 0,
            };
          });

          appsMap.set(currentAppCode, app);
        }

        const assessor = col2 && col2 !== 'Unknown - ???' ? col2 : '-';
        if (app.pillars[currentPillarKey]) {
          app.pillars[currentPillarKey].assessor = assessor;
        }
        continue;
      }

      if (!currentAppCode || !currentPillarKey) continue;
      const app = appsMap.get(currentAppCode);
      if (!app || !app.pillars[currentPillarKey]) continue;

      const pillar = app.pillars[currentPillarKey];
      const rowLabel = col2;
      const dateVal = this.parseDate(row[4]);
      const metricType = row[5]?.trim() || '';
      const rawVal = row[6]?.trim() || '';

      if (rowLabel === 'Last Released Assessment -1') {
        if (dateVal) pillar.prevDate = dateVal;
        if (metricType === 'Score') pillar.prevScore = this.parseScore(rawVal);
        if (metricType === 'Level') pillar.prevLevel = this.parseLevel(rawVal);
      } else if (rowLabel === 'Last Released Assessment') {
        if (dateVal) pillar.date = dateVal;
        if (metricType === 'Score') pillar.score = this.parseScore(rawVal);
        if (metricType === 'Level') pillar.level = this.parseLevel(rawVal);
      } else if (rowLabel === 'Last Pending Assessment snapshot -1') {
        pillar.prevExtract = this.parseExtract(rawVal);
      } else if (rowLabel === 'Last Pending Assessment snapshot') {
        pillar.lastExtract = this.parseExtract(rawVal);
      }
    }

    const applications = Array.from(appsMap.values()).map((app) => {
      let lastDate: string | null = null;
      let prevDate: string | null = null;

      for (const pillar of Object.values(app.pillars)) {
        if (pillar.date && (!lastDate || pillar.date > lastDate)) {
          lastDate = pillar.date;
        }
        if (pillar.prevDate && (!prevDate || pillar.prevDate > prevDate)) {
          prevDate = pillar.prevDate;
        }
      }

      app.lastAssessmentDate = lastDate;
      app.prevAssessmentDate = prevDate;
      return app;
    });

    const timestamp = pyResult.datetimeExtract || new Date().toISOString();

    return {
      updatedAt: timestamp,
      generatedAt: timestamp,
      pillars: PILLARS_DEFINITIONS,
      applications,
    };
  }

  private static parseDate(val: string | undefined): string | null {
    if (!val) return null;
    const trimmed = val.trim();
    return trimmed === '' || trimmed === 'null' || trimmed === 'None' ? null : trimmed;
  }

  private static parseScore(val: string | undefined): number {
    if (!val) return 0.0;
    const trimmed = val.trim();
    if (trimmed === 'None' || trimmed === 'null' || trimmed === '') return 0.0;
    const num = parseFloat(trimmed.replace(',', '.'));
    return isNaN(num) ? 0.0 : Math.round(num * 100) / 100;
  }

  private static parseLevel(val: string | undefined): string {
    if (!val) return 'Lvl 0';
    const trimmed = val.trim();
    if (trimmed === 'None' || trimmed === 'null' || trimmed === '') return 'Lvl 0';
    const num = parseInt(trimmed.replace(',', '.'), 10);
    return isNaN(num) ? 'Lvl 0' : `Lvl ${num}`;
  }

  private static parseExtract(val: string | undefined): number {
    if (!val) return 0;
    const trimmed = val.trim();
    if (trimmed === 'None' || trimmed === 'null' || trimmed === '') return 0;
    const str = trimmed.replace(',', '.');
    const num = parseFloat(str);
    if (isNaN(num)) return 0;
    if (num <= 1.0 && num > 0 && str.includes('.')) {
      return Math.round(num * 100);
    }
    return Math.round(num);
  }

  private static formatAppName(code: string): string {
    if (!code) return '';
    if (code === code.toUpperCase() && !code.includes('_') && code.length <= 5) {
      return code;
    }
    return code
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

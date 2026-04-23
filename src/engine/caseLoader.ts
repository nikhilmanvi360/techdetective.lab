import fs from 'fs/promises';
import path from 'path';

export type MissionType = 'coding' | 'puzzle' | 'hybrid';

export interface DynamicCase {
  id: string;
  type: MissionType;
  title: string;
  round: 'ROUND_1' | 'ROUND_2' | 'FINAL';
  points: number;
  brief: {
    summary: string;
    description: string;
    hints: string[];
  };
  check: {
    expected_output?: string; // For coding/puzzle
    logic_expression?: string; // For hybrid/puzzle boolean logic
    piston_language?: string;  // e.g. javascript, python
  };
  topology?: any; // For spatial traversal missions
  starter_code?: string;
  is_hidden_initially: boolean;
}

export class CaseLoader {
  private static casesDir = path.join(process.cwd(), 'cases');

  static async listAllCases(): Promise<DynamicCase[]> {
    try {
      const files = await fs.readdir(this.casesDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      const cases: DynamicCase[] = [];
      for (const file of jsonFiles) {
        const content = await fs.readFile(path.join(this.casesDir, file), 'utf8');
        cases.push(JSON.parse(content));
      }
      
      return cases;
    } catch (err) {
      console.error('[CASE LOADER] Failed to read cases:', err);
      return [];
    }
  }

  static async getCaseById(id: string): Promise<any | null> {
    const all = await this.listAllCases();
    const caseObj = all.find(c => c.id === id);
    if (!caseObj) return null;
    return {
      ...caseObj,
      metadata: {
        brief: caseObj.brief,
        check: caseObj.check
      }
    };
  }
}

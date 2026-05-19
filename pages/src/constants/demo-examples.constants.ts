/**
 * @file        demo-examples.constants.ts
 * @description Demo examples untuk Try Demo fitur
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

export interface DemoExample {
  id: string;
  name: string;
  description: string;
  videoPath: string;
  groundTruthId: string; // Reference ke sentence_id dari GROUND_TRUTH_SENTENCES
  duration?: number; // durasi dalam detik
}

export const DEMO_EXAMPLES: DemoExample[] = [
  {
    id: 'demo-001',
    name: 'Demo Sample 1',
    description: 'Contoh video BISINDO untuk testing',
    videoPath: 'demos/videos/ANDRI_RUMAH DIMANA KAMU_01.mp4',
    groundTruthId: 'S029', // AYAH SAMA IBU MANA
    duration: 5,
  },
];

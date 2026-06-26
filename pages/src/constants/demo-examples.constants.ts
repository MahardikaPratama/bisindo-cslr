/**
 * @file        demo-examples.constants.ts
 * @description Demo examples untuk Try Demo fitur
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

export interface DemoExample {
  videoPath: string;
  groundTruthId: string; // Reference ke sentence_id dari GROUND_TRUTH_SENTENCES
}

export const DEMO_EXAMPLES: DemoExample[] = [
  {
    videoPath: 'demos/videos/P6_S24_MJ.mp4',
    groundTruthId: 'S24', // RUMAH DIMANA KAMU
  },
];

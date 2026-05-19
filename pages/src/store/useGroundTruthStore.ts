/**
 * @file        useGroundTruthStore.ts
 * @description Zustand store untuk ground truth (kalimat referensi pembanding hasil inferensi)
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import { create } from 'zustand';

export interface GroundTruthItem {
  id: string;
  text: string;
}

interface GroundTruthStore {
  /** Kalimat ground truth yang dipilih user */
  selectedGroundTruth: GroundTruthItem | null;

  /** Set pilihan ground truth */
  setSelectedGroundTruth: (item: GroundTruthItem | null) => void;
  /** Reset state */
  reset: () => void;
}

const INITIAL_STATE = {
  selectedGroundTruth: null,
};

export const useGroundTruthStore = create<GroundTruthStore>((set) => ({
  ...INITIAL_STATE,

  setSelectedGroundTruth: (item) => {
    set({ selectedGroundTruth: item });
  },

  reset: () => {
    set(INITIAL_STATE);
  },
}));

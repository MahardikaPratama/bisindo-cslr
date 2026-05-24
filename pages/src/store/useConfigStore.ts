import { create } from 'zustand';

interface ConfigStore {
  selectedConfig: string | null;
  availableConfigs: string[];
  
  setSelectedConfig: (config: string) => void;
  setAvailableConfigs: (configs: string[]) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  selectedConfig: null,
  availableConfigs: [],
  
  setSelectedConfig: (config) => set({ selectedConfig: config }),
  setAvailableConfigs: (configs) => set({ availableConfigs: configs }),
}));

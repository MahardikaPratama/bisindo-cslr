import { create } from 'zustand';

interface ConfigStore {
  selectedConfig: string;
  availableConfigs: string[];
  
  setSelectedConfig: (config: string) => void;
  setAvailableConfigs: (configs: string[]) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  selectedConfig: 'Double_Cosign_sd.yaml', // default
  availableConfigs: [],
  
  setSelectedConfig: (config) => set({ selectedConfig: config }),
  setAvailableConfigs: (configs) => set({ availableConfigs: configs }),
}));

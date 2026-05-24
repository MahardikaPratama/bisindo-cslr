/**
 * @file        ConfigSelector.tsx
 * @description Component untuk memilih konfigurasi preprocessing (misal Baseline+TN.yaml)
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React, { useEffect, useState } from 'react';
import DropdownSearch from '../../common/DropdownSearch/DropdownSearch';
import { useConfigStore } from '../../store/useConfigStore';
import { useConsoleStore } from '../../store/useConsoleStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface ConfigSelectorProps {
  className?: string;
}

const ConfigSelector = React.memo(function ConfigSelector({ className }: ConfigSelectorProps) {
  const { selectedConfig, availableConfigs, setSelectedConfig, setAvailableConfigs } = useConfigStore();
  const { appendLog } = useConsoleStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchConfigs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/configs`);
        if (!res.ok) throw new Error('Failed to fetch configs');
        const data = await res.json();
        
        if (isMounted) {
          setAvailableConfigs(data.configs || []);
          if (!selectedConfig && data.default) {
            setSelectedConfig(data.default);
          }
        }
      } catch (err: any) {
        appendLog('ERROR', `Failed to load configs: ${err.message}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchConfigs();
    
    return () => {
      isMounted = false;
    };
  }, [setAvailableConfigs, setSelectedConfig, appendLog, selectedConfig]);

  // Convert string ke format yang diterima DropdownSearch (id, text)
  const allItems = availableConfigs.map((cfg) => ({
    id: cfg,
    text: cfg,
  }));
  
  const currentItem = allItems.find((i) => i.id === selectedConfig) || null;

  return (
    <DropdownSearch
      label="Preprocessing Config"
      placeholder={loading ? "Loading configs..." : "Select config..."}
      items={allItems}
      selectedItem={currentItem}
      onSelect={(item) => setSelectedConfig(item.id)}
      className={className}
    />
  );
});

export default ConfigSelector;

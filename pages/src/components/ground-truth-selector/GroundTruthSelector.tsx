/**
 * @file        GroundTruthSelector.tsx
 * @description Component untuk memilih kalimat ground truth reference
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React from 'react';
import DropdownSearch from '../../common/DropdownSearch/DropdownSearch';
import { useGroundTruthStore } from '../../store/useGroundTruthStore';
import { GROUND_TRUTH_SENTENCES } from '../../constants/ground-truth.constants';
import type { GroundTruthItem } from '../../store/useGroundTruthStore';

interface GroundTruthSelectorProps {
  className?: string;
}

const GroundTruthSelector = React.memo(function GroundTruthSelector({ className }: GroundTruthSelectorProps) {
  const { selectedGroundTruth, setSelectedGroundTruth } = useGroundTruthStore();

  // Convert sentences ke GroundTruthItem format (sudah punya sentence_id dari constants)
  const allItems: GroundTruthItem[] = GROUND_TRUTH_SENTENCES.map((sentence) => ({
    id: sentence.sentence_id,
    text: sentence.text,
  }));

  const handleSelect = (item: GroundTruthItem) => {
    setSelectedGroundTruth(item);
  };

  return (
    <DropdownSearch
      label="Ground Truth Reference"
      placeholder="Select kalimat..."
      items={allItems}
      selectedItem={selectedGroundTruth}
      onSelect={handleSelect}
      className={className}
    />
  );
});

export default GroundTruthSelector;

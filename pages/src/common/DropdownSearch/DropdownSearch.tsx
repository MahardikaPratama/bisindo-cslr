/**
 * @file        DropdownSearch.tsx
 * @description Reusable dropdown search component dengan 3 states: selected, hover, default
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React, { useState, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';

export interface DropdownSearchItem {
  id: string;
  text: string;
  [key: string]: any;
}

interface DropdownSearchProps<T extends DropdownSearchItem> {
  /** Label untuk dropdown */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** List semua items */
  items: T[];
  /** Item yang sedang dipilih */
  selectedItem: T | null;
  /** Callback saat item dipilih */
  onSelect: (item: T) => void;
  /** Custom className */
  className?: string;
  /** Max height dropdown (default: 280px) */
  maxHeight?: string;
}

const DropdownSearch = React.memo(function DropdownSearch<T extends DropdownSearchItem>({
  label,
  placeholder = 'Select item...',
  items,
  selectedItem,
  onSelect,
  className,
  maxHeight = '170px',
}: DropdownSearchProps<T>) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items berdasarkan search query, selected item di paling atas
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // Filter berdasarkan search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = items.filter((item) => item.text.toLowerCase().includes(query));
    }
    
    // Sort: selected item di paling atas
    return filtered.sort((a, b) => {
      if (selectedItem?.id === a.id) return -1;
      if (selectedItem?.id === b.id) return 1;
      return 0;
    });
  }, [items, searchQuery, selectedItem?.id]);

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsOpen(false);
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={cn('relative', className)}>
      {/* Label */}
      <label className="block mb-2 text-xs font-medium tracking-wider uppercase text-text-secondary">
        {label}
      </label>

      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-3 py-2.5 rounded-lg border flex items-center justify-between',
          'bg-surface-panel-2 border-surface-border/50 text-text-primary',
          'hover:border-surface-border hover:bg-surface-panel-1 transition-colors',
          'text-sm font-medium text-left truncate'
        )}
      >
        <span className="truncate">{selectedItem?.text || placeholder}</span>
        <ChevronDown size={16} className={cn('flex-shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Container - key forces re-render saat theme berubah */}
          <div
            key={`dropdown-${theme}`}
            className={cn(
              'absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border shadow-xl overflow-hidden',
              theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            )}
          >
            {/* Search Box */}
            <div
              className={cn(
                'sticky top-0 px-3 py-2 border-b flex items-center gap-2',
                theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'
              )}
            >
              <Search size={14} className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'flex-1 text-sm outline-none bg-transparent',
                  theme === 'dark' ? 'text-slate-200 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                )}
                autoFocus
              />
              {searchQuery && (
                <button onClick={clearSearch} className="p-0.5">
                  <X size={14} className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} />
                </button>
              )}
            </div>

            {/* Scrollable Items */}
            <div style={{ maxHeight }} className={cn('overflow-y-auto', theme === 'dark' ? 'bg-slate-800' : 'bg-white')}>
              {/* Items List - 3 States: Default, Hover, Selected */}
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      'w-full px-4 py-2 text-sm text-left flex items-center justify-between transition-colors border-b',
                      // Default state
                      theme === 'dark'
                        ? 'border-slate-700 text-slate-200'
                        : 'border-slate-100 text-slate-900',
                      // Hover state
                      theme === 'dark'
                        ? 'hover:bg-slate-700'
                        : 'hover:bg-blue-50',
                      // Selected state
                      selectedItem?.id === item.id && (
                        theme === 'dark'
                          ? 'bg-blue-900 hover:bg-blue-900 text-blue-300'
                          : 'bg-blue-100 hover:bg-blue-100'
                      )
                    )}
                  >
                    <span className="flex-1 truncate">{item.text}</span>
                    {selectedItem?.id === item.id && (
                      <Check
                        size={14}
                        className={cn('ml-2 flex-shrink-0', theme === 'dark' ? 'text-blue-400' : 'text-blue-600')}
                      />
                    )}
                  </button>
                ))
              ) : (
                <div
                  className={cn(
                    'px-4 py-4 text-center text-sm',
                    theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'
                  )}
                >
                  Tidak ada hasil ditemukan
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export default DropdownSearch;

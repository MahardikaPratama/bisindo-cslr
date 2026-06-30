import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { AVAILABLE_CONFIGS } from '../../constants/configs.constants';

interface ConfigDropdownProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  buttonClassName?: string;
  activeItemClassName?: string;
}

const ConfigDropdown = React.memo(function ConfigDropdown({ 
  value, 
  onChange, 
  className, 
  buttonClassName,
  activeItemClassName = "text-brand-blue"
}: ConfigDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "bg-surface-bg border text-text-primary text-sm rounded-lg flex items-center justify-between p-2 min-w-[100px] outline-none",
          buttonClassName
        )}
      >
        {value}
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 w-full bg-surface-bg border border-surface-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {AVAILABLE_CONFIGS.map(cfg => (
            <div 
              key={cfg} 
              className={cn(
                "p-2 cursor-pointer hover:bg-surface-hover text-sm", 
                value === cfg ? `bg-surface-hover font-bold ${activeItemClassName}` : "text-text-primary"
              )}
              onClick={() => { onChange(cfg); setIsOpen(false); }}
            >
              {cfg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ConfigDropdown;

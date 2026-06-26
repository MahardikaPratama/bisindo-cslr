/**
 * @file        Navbar.tsx
 * @description Navbar komponen utama. Menampilkan logo, navigation links,
 *              status badges (MODEL LOADED, GPU info), dan icon actions.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React from 'react';
import { Settings, User, Cpu, Moon, Sun } from 'lucide-react';
import { cn } from '../../utils/cn';
import Badge from '../../common/Badge/Badge';
import { NAV_LINKS } from '../../constants/nav.constants';
import { useTheme } from '../../hooks/useTheme';

const Navbar = React.memo(function Navbar() {
  const { theme, toggleTheme } = useTheme();
  return (
    <nav
      id="main-navbar"
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'bg-surface-bg/80 backdrop-blur-xl',
        'border-b border-surface-border',
        'animate-fade-in'
      )}
    >
      <div className="flex items-center justify-between h-16 max-w-screen-xl gap-6 px-6 mx-auto">
        {/* ── Logo ── */}
        <div className="flex items-center flex-shrink-0 gap-3">
          <div className="flex items-center justify-center border rounded-lg w-9 h-9 bg-brand-blue/10 border-brand-blue/20 p-1">
            <img src="/isyarat.png" alt="BISINDO Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-base font-semibold tracking-tight text-text-primary whitespace-nowrap">
            BISINDO CSLR Demo
          </span>
        </div>

        {/* ── Status Badges + Icons ── */}
        <div className="flex items-center flex-shrink-0 gap-3">
          <button
            id="btn-theme"
            aria-label="Toggle Theme"
            onClick={toggleTheme}
            className="p-2 transition-colors duration-200 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover"
          >
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>
    </nav>
  );
});

export default Navbar;

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
      <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* ── Logo ── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center">
            <span className="text-xl leading-none" role="img" aria-label="sign language">🤟</span>
          </div>
          <span className="font-semibold text-base text-text-primary tracking-tight whitespace-nowrap">
            BISINDO CSLR Demo
          </span>
        </div>

        {/* ── Nav Links ── */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              id={`nav-link-${link.label.toLowerCase()}`}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200',
                link.active
                  ? 'text-text-primary border-b-2 border-brand-blue pb-[6px]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* ── Status Badges + Icons ── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge variant="success" dot>Model Loaded</Badge>
          <div className="hidden sm:flex items-center gap-2 bg-surface-panel border border-surface-border rounded-lg px-3 py-1.5">
            <Cpu size={13} className="text-text-secondary" />
            <span className="text-xs font-medium text-text-primary">GPU: RTX 4090</span>
          </div>
          <button
            id="btn-theme"
            aria-label="Toggle Theme"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-200"
          >
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            id="btn-settings"
            aria-label="Settings"
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-200"
          >
            <Settings size={16} />
          </button>
          <button
            id="btn-user"
            aria-label="User profile"
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-200"
          >
            <User size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
});

export default Navbar;

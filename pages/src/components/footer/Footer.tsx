/**
 * @file        Footer.tsx
 * @description Footer komponen.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

import React from 'react';
import { FOOTER_LINKS } from '../../constants/nav.constants';

const Footer = React.memo(function Footer() {
  return (
    <footer className="w-full border-t border-surface-border bg-surface-bg mt-auto py-6">
      <div className="max-w-screen-xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left */}
        <div className="flex flex-col">
          <span className="font-bold text-sm text-text-primary">BISINDO CSLR</span>
          <span className="font-bold text-sm text-text-primary">KoTA 502</span>
        </div>

        {/* Center */}
        <div className="text-xs text-text-secondary text-center max-w-md">
          © 2024 Continuous Sign Language Recognition Research. Powered by PyTorch & MediaPipe.
        </div>

        {/* Right */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-text-secondary">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-text-primary transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
});

export default Footer;

/**
 * @file        nav.constants.ts
 * @description Konstanta navigasi Navbar: link definitions dan footer links.
 * @author      KoTA 502
 * @version     1.0.0
 * @created     2024-01-01
 */

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

export const NAV_LINKS: NavLink[] = [];

export const FOOTER_LINKS = [
  { label: 'GitHub Repository',    href: 'https://github.com' },
  { label: 'Research Institution', href: '#' },
  { label: 'Publications',         href: '#' },
  { label: 'Team',                 href: '#' },
];

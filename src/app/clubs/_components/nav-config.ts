export interface NavItem {
  href: string;
  label: string;
  comingSoon?: boolean;
}

export interface NavGroup {
  key: string;
  label: string;
  children: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'get-started',
    label: 'Get Started',
    children: [
      { href: '/clubs/dashboard', label: 'Home' },
      { href: '/clubs/workflows', label: 'Workflows' },
      { href: '/clubs/chat', label: 'AI Agents' },
      { href: '/clubs/reports', label: 'Reports' },
      { href: '/clubs/accuracy', label: 'Accuracy' },
    ],
  },
  {
    key: 'transfer-ops',
    label: 'Transfer Ops',
    children: [
      { href: '/clubs/pipeline', label: 'Buy Pipeline', comingSoon: true },
      { href: '/clubs/transfer-intel', label: 'Sell Pipeline', comingSoon: true },
      { href: '/clubs/negotiations', label: 'Negotiations' },
      { href: '/clubs/exit-performance', label: 'Exits & Revenue' },
    ],
  },
  {
    key: 'team-ops',
    label: 'Team Ops',
    children: [
      { href: '/clubs/squad', label: 'Squad' },
      { href: '/clubs/academy', label: 'Academy' },
      { href: '/clubs/match-analysis', label: 'Match Analysis' },
      { href: '/clubs/wellness', label: 'Wellness' },
      { href: '/clubs/brain', label: 'Brain' },
      { href: '/clubs/todo', label: 'To Do' },
      { href: '/clubs/staff-tools', label: 'Staff Tools' },
    ],
  },
  {
    key: 'databases',
    label: 'Databases',
    children: [
      { href: '/clubs/scout', label: 'Scout Players' },
      { href: '/clubs/club-data', label: 'Clubs' },
      { href: '/clubs/agencies', label: 'Agencies' },
      { href: '/clubs/report-cards', label: 'Report Cards' },
      { href: '/clubs/alumni', label: 'Alumni' },
      { href: '/clubs/compare', label: 'Compare' },
    ],
  },
];

/** Only the wellness route exists in this prototype. */
export const IMPLEMENTED_ROUTES = new Set(['/clubs/wellness']);

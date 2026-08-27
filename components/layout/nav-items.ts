import {
  LayoutDashboard,
  Users,
  ClipboardList,
  LineChart,
  MessageCircle,
  FileText,
  Mail,
  Bell,
  CreditCard,
  Settings,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Present once the feature ships; until then the item renders disabled with a "Soon" badge. */
  comingSoon?: boolean;
}

/** The full nav — used by both the desktop sidebar and the mobile hamburger drawer (PRD §22). Unbuilt phases stay visible but disabled so the nav reads as complete, not sparse. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  // Still flagged: plans are client-scoped (built at /clients/[id]/plan), and
  // there's no single global destination a top-level nav item could link to.
  { label: 'Plans', href: '/plans', icon: ClipboardList, comingSoon: true },
  { label: 'Progress', href: '/progress', icon: LineChart, comingSoon: true },
  { label: 'AI Coach', href: '/ai-coach', icon: MessageCircle, comingSoon: true },
  { label: 'Reports', href: '/reports', icon: FileText, comingSoon: true },
  { label: 'Messages', href: '/messages', icon: Mail, comingSoon: true },
  { label: 'Notifications', href: '/notifications', icon: Bell, comingSoon: true },
  { label: 'Subscription', href: '/subscription', icon: CreditCard, comingSoon: true },
  { label: 'Settings', href: '/settings', icon: Settings, comingSoon: true },
  { label: 'Help & Support', href: '/help', icon: HelpCircle, comingSoon: true },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  // Still flagged: plans are client-scoped (built at /clients/[id]/plan), and
  // there's no single global destination a top-level nav item could link to.
  { label: 'Plans', href: '/plans', icon: ClipboardList, comingSoon: true },
  { label: 'Chat', href: '/ai-coach', icon: MessageCircle, comingSoon: true },
];

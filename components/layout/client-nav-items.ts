import { Dumbbell, UtensilsCrossed, ClipboardCheck, Images, type LucideIcon } from 'lucide-react';

export interface ClientNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** The client app's entire nav — deliberately just four items and a bottom bar, no sidebar/hamburger (PRD's client surface is far smaller than the coach dashboard). */
export const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  { label: 'Today', href: '/today', icon: Dumbbell },
  { label: 'Nutrition', href: '/nutrition', icon: UtensilsCrossed },
  { label: 'Check-in', href: '/checkin', icon: ClipboardCheck },
  { label: 'Progress', href: '/progress', icon: Images },
];

import type { IconName } from './ui/Icon';
import type { Route } from './hooks/useHashRoute';

export interface NavItem {
  route: Route;
  label: string;
  icon: IconName;
  children?: Array<{ route: Route; label: string; short: string }>;
}

export const NAV: NavItem[] = [
  { route: 'guide', label: 'Guide', icon: 'compass' },
  {
    route: 'attendees',
    label: 'Attendees',
    icon: 'users',
    children: [
      { route: 'attendees', label: 'Attendees', short: 'Attendees' },
      { route: 'attendee-types', label: 'Attendee types', short: 'Types' },
      { route: 'packages', label: 'Packages', short: 'Packages' },
      { route: 'reg-codes', label: 'Reg codes', short: 'Codes' },
      { route: 'discounts', label: 'Discounts', short: 'Discounts' },
    ],
  },
  { route: 'content', label: 'Content', icon: 'calendar-days' },
  { route: 'exhibitors', label: 'Exhibitors', icon: 'store' },
];

export const ATTENDEE_ROUTES: Route[] = ['attendees', 'attendee-types', 'packages', 'reg-codes', 'discounts'];

/** The top-level nav item a route belongs to. */
export function topLevelOf(route: Route): Route {
  return ATTENDEE_ROUTES.includes(route) ? 'attendees' : route;
}

export const ROUTE_LABEL: Record<Route, string> = {
  guide: 'Event setup guide',
  attendees: 'Attendees',
  'attendee-types': 'Attendee types',
  packages: 'Packages',
  'reg-codes': 'Reg codes',
  discounts: 'Discounts',
  content: 'Content',
  exhibitors: 'Exhibitors',
};

export const ROUTE_ICON: Record<Route, IconName> = {
  guide: 'compass',
  attendees: 'users',
  'attendee-types': 'tag',
  packages: 'ticket',
  'reg-codes': 'key-round',
  discounts: 'percent',
  content: 'calendar-days',
  exhibitors: 'store',
};

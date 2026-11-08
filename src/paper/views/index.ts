import type { ComponentType } from 'react';
import type { Route } from '../hooks/useHashRoute';
import type { ViewProps } from '../shell/ViewSwitch';
import { GuideView } from './guide/GuideView';
import { AttendeesView } from './attendees/AttendeesView';
import { AttendeeTypesView } from './attendee-types/AttendeeTypesView';
import { PackagesView } from './packages/PackagesView';
import { RegCodesView } from './reg-codes/RegCodesView';
import { DiscountsView } from './discounts/DiscountsView';
import { ContentView } from './content/ContentView';
import { ExhibitorsView } from './exhibitors/ExhibitorsView';

export const VIEWS: Record<Route, ComponentType<ViewProps>> = {
  guide: GuideView,
  attendees: AttendeesView,
  'attendee-types': AttendeeTypesView,
  packages: PackagesView,
  'reg-codes': RegCodesView,
  discounts: DiscountsView,
  content: ContentView,
  exhibitors: ExhibitorsView,
};

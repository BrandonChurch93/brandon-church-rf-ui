import { createContext, useContext } from 'react';
import type { Route } from '../hooks/useHashRoute';

export interface RouteContextValue {
  route: Route;
  navigate: (r: Route) => void;
}
export const RouteContext = createContext<RouteContextValue>({ route: 'guide', navigate: () => undefined });
export const useRoute = () => useContext(RouteContext);

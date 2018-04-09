import { LayoutState, LayoutStateModel } from './layout';
import { TabsState, TabsStateModel } from './tabs';

export interface AppState {
  layout: LayoutStateModel;
  tabs: TabsStateModel;
}

export const states = [
  LayoutState,
  TabsState
];

import { LayoutState, LayoutStateModel } from './layout';
import { TabsState, TabsStateModel } from './tabs';
import { WindowState, WindowStateModel } from './window';

export interface AppState {
  layout: LayoutStateModel;
  tabs: TabsStateModel;
  window: WindowStateModel;
}

export const states = [
  LayoutState,
  TabsState,
  WindowState
];

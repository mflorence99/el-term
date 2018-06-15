import { LayoutState } from './layout';
import { LayoutStateModel } from './layout';
import { TabsState } from './tabs';
import { TabsStateModel } from './tabs';
import { WindowState } from './window';
import { WindowStateModel } from './window';

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

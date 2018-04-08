import { LayoutState, LayoutStateModel } from './layout';

export interface AppState {
  layout: LayoutStateModel;
}

export const states = [
  LayoutState
];

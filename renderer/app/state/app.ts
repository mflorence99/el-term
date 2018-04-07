import { MenuState, MenuStateModel } from './menu';

export interface AppState {
  menu: MenuStateModel;
}

export const states = [
  MenuState
];

import { Action, State, StateContext } from '@ngxs/store';

/** NOTE: actions must come first because of AST */

export class UpdateMenuItems {
  constructor(public readonly payload: MenuItem[]) {}
}

export class MenuItem {
  constructor(public label: string) { }
}

export interface MenuStateModel {
  items: MenuItem[];
}

@State<MenuStateModel>({
  name: 'menu',
  defaults: {
    items: [
      new MenuItem('this'),
      new MenuItem('that')
    ]
  }
}) export class MenuState {

  @Action(UpdateMenuItems)
  updateMenuItems({ getState, setState }: StateContext<MenuStateModel>,
                  { payload }: UpdateMenuItems) {
    setState({...getState(), items: payload});
  }

}

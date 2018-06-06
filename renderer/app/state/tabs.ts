import { Action, State, StateContext } from '@ngxs/store';
import { NewLayout, RemoveLayout } from './layout';

import { UUID } from 'angular2-uuid';

/** NOTE: actions must come first because of AST */

export class MoveTab {
  static readonly type = '[Tabs] move tab';
  constructor(public readonly payload: { tab: Tab, ix: number }) { }
}

export class NewTab {
  static readonly type = '[Tabs] new tab';
  constructor(public readonly payload?: any) { }
}

export class RemoveTab {
  static readonly type = '[Tabs] remove tab';
  constructor(public readonly payload: { tab: Tab }) { }
}

export class SelectPermanentTab {
  static readonly type = '[Tabs] select permanent tab';
  constructor(public readonly payload?: any) { }
}

export class SelectTab {
  static readonly type = '[Tabs] select tab';
  constructor(public readonly payload: { tab: Tab }) { }
}

export class UpdateTab {
  static readonly type = '[Tabs] update tab';
  constructor(public readonly payload: { tab: Tab }) { }
}

/**
 * Model an individual tab
 */

export class Tab {

  /** ctor */
  constructor(public label: string,
              public icon = 'fab linux',
              public color = 'var(--mat-grey-100)',
              public permanent = false,
              public id = UUID.UUID(),
              public selected = false) { }

}

export interface TabsStateModel {
  tabs: Tab[];
}

@State<TabsStateModel>({
  name: 'tabs',
  defaults: {
    tabs: [
      // NOTE: the base "permanent" tab has a well-known ID b/c we use in in layout
      new Tab('My Sessions', 'fab linux', 'var(--mat-grey-100)', true, '0', true)
    ]
  }
}) export class TabsState {

  /** Deep find a layout by its ID */
  private static findTabIndexByID(model: TabsStateModel,
                                  id: string): number {
    return model.tabs.findIndex(tab => tab.id === id);
  }

  @Action(MoveTab)
  moveTab({ getState, setState }: StateContext<TabsStateModel>,
          { payload }: MoveTab) {
    const { tab, ix } = payload;
    const state = getState();
    const iy = TabsState.findTabIndexByID(state, tab.id);
    if (iy !== -1) {
      state.tabs = state.tabs.slice(0);
      state.tabs.splice(iy, 1);
      state.tabs.splice(ix, 0, tab);
      setState({ ...state });
    }
  }

  @Action(NewTab)
  newTab({ dispatch, getState, setState }: StateContext<TabsStateModel>,
         { payload }: NewTab) {
    const state = getState();
    const tab = new Tab('More Sessions');
    state.tabs = state.tabs.slice(0);
    state.tabs.push(tab);
    dispatch(new NewLayout({ splitID: tab.id }));
    setState({ ...state });
  }

  @Action(RemoveTab)
  removeTab({ dispatch, getState, setState }: StateContext<TabsStateModel>,
            { payload }: RemoveTab) {
    const { tab } = payload;
    const state = getState();
    const ix = TabsState.findTabIndexByID(state, tab.id);
    if (ix !== -1) {
      state.tabs = state.tabs.slice(0);
      state.tabs.splice(ix, 1);
      dispatch(new RemoveLayout({ splitID: tab.id }));
      setState({ ...state });
      if (tab.selected)
        dispatch(new SelectPermanentTab());
    }
  }

  @Action(SelectPermanentTab)
  selectPermanentTab({ getState, setState }: StateContext<TabsStateModel>,
                     { payload }: SelectPermanentTab) {
    const state = getState();
    state.tabs = state.tabs.map(tab => ({ ...tab, selected: tab.permanent }));
    setState({ ...state });
  }

  @Action(SelectTab)
  selectTab({ getState, setState }: StateContext<TabsStateModel>,
            { payload }: SelectTab) {
    const { tab } = payload;
    const state = getState();
    state.tabs = state.tabs.map(tab_ =>({ ...tab_, selected: tab.id === tab_.id }));
    setState({ ...state });
  }

  @Action(UpdateTab)
  updateTab({ getState, setState }: StateContext<TabsStateModel>,
            { payload }: UpdateTab) {
    const { tab } = payload;
    const state = getState();
    const ix = TabsState.findTabIndexByID(state, tab.id);
    if (ix !== -1) {
      state.tabs = state.tabs.slice(0);
      state.tabs[ix] = { ...state.tabs[ix], ...tab };
      setState({ ...state });
    }
  }

}

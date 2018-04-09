import { Action, State, StateContext, Store } from '@ngxs/store';
import { NewLayout, RemoveLayout } from './layout';

import { UUID } from 'angular2-uuid';

/** NOTE: actions must come first because of AST */

export class MoveTab {
  constructor(public readonly payload: { tab, ix }) { }
}

export class NewTab {
  constructor(public readonly payload?: any) { }
}

export class RemoveTab {
  constructor(public readonly payload: Tab) { }
}

export class SelectTab {
  constructor(public readonly payload: Tab) { }
}

export class UpdateTab {
  constructor(public readonly payload: any) { }
}

/**
 * Model an individual tab
 */

export class Tab {

  /** ctor */
  constructor(public label: string,
              public icon = 'fab fa-linux',
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
      new Tab('My Sessions', 'fab fa-linux', 'var(--mat-grey-100)', true, '0', true)
    ]
  }
}) export class TabsState {

  /** Deep find a layout by its ID */
  private static findTabIndexByID(model: TabsStateModel,
                                  id: string): number {
    return model.tabs.findIndex(tab => tab.id === id);
  }

  /** ctor */
  constructor(private store: Store) { }

  @Action(MoveTab)
  moveTab({ getState, setState }: StateContext<TabsStateModel>,
          { payload }: MoveTab) {
    const updated = getState();
    const ix = TabsState.findTabIndexByID(updated, payload.tab.id);
    updated.tabs.splice(ix, 1);
    updated.tabs.splice(payload.ix, 0, payload.tab);
    setState({...updated});
  }

  @Action(NewTab)
  newTab({ getState, setState }: StateContext<TabsStateModel>,
         { payload }: NewTab) {
    const updated = getState();
    const tab = new Tab('More Sessions');
    updated.tabs.push(tab);
    this.store.dispatch(new NewLayout(tab.id));
    setState({...updated});
  }

  @Action(RemoveTab)
  removeTab({ getState, setState }: StateContext<TabsStateModel>,
            { payload }: RemoveTab) {
    const updated = getState();
    const ix = TabsState.findTabIndexByID(updated, payload.id);
    updated.tabs.splice(ix, 1);
    this.store.dispatch(new RemoveLayout(payload.id));
    setState({...updated});
  }

  @Action(SelectTab)
  selectTab({ getState, setState }: StateContext<TabsStateModel>,
            { payload }: SelectTab) {
    const updated = getState();
    updated.tabs.forEach(tab => tab.selected = (tab.id === payload.id));
    setState({...updated});
  }

  @Action(UpdateTab)
  updateTab({ getState, setState }: StateContext<TabsStateModel>,
            { payload }: UpdateTab) {
    const updated = getState();
    const ix = TabsState.findTabIndexByID(updated, payload.id);
    Object.assign(updated.tabs[ix], payload);
    setState({...updated});
  }

}

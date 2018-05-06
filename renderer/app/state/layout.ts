import { Action, State, StateContext } from '@ngxs/store';

import { TerminalService } from '../services/terminal';
import { UUID } from 'angular2-uuid';
import { nextTick } from 'ellib';

/** NOTE: actions must come first because of AST */

export class CloseSplit {
  static readonly type = '[Layout] close split';
  constructor(public readonly payload: {id: string, ix: number}) { }
}

export class MakeSplit {
  static readonly type = '[Layout] make split';
  constructor(public readonly payload:
    {id: string, ix: number, direction: 'horizontal' | 'vertical', before: boolean}) { }
}

export class NewLayout {
  static readonly type = '[Layout] new layout';
  constructor(public readonly payload: string) { }
}

export class RemoveLayout {
  static readonly type = '[Layout] remove layout';
  constructor(public readonly payload: string) { }
}

export class SetPrefs {
  static readonly type = '[Layout] set prefs';
  constructor(public readonly payload: {id: string, prefs: LayoutPrefs}) { }
}

export class SetSearch {
  static readonly type = '[Layout] set search';
  constructor(public readonly payload: {id: string, search: LayoutSearch}) { }
}

export class SetSearchWrap {
  static readonly type = '[Layout] set search wrap';
  constructor(public readonly payload: {id: string, wrap: boolean}) { }
}

export class SwapWith {
  static readonly type = '[Layout] swap with';
  constructor(public readonly payload: {id: string, with: string}) { }
}

export class UpdateSplitSizes {
  static readonly type = '[Layout] update split sizes';
  constructor(public readonly payload: {id: string, sizes: number[]}) { }
}

export interface Layout {
  direction?: 'horizontal' | 'vertical';
  id: string;
  prefs?: LayoutPrefs;
  root?: boolean;
  search?: LayoutSearch;
  size: number;
  splits?: Layout[];
}

export interface LayoutPrefs {
  badge?: string;
  directory?: string;
  startup?: string;
  title?: string;
}

export interface LayoutSearch {
  str?: string;
  wrap?: boolean;
}

export interface LayoutStateModel {
  [s: string]: Layout;
}

@State<LayoutStateModel>({
  name: 'layout',
  defaults: {
    // NOTE: this is the well-known ID of the "permanent" tab
    '0': LayoutState.defaultLayout()
  }
}) export class LayoutState {

  /** Create the default layout */
  static defaultLayout(): Layout {
    return {
      direction: 'vertical',
      id: UUID.UUID(),
      prefs: { } as LayoutPrefs,
      root: true,
      search: { } as LayoutSearch,
      size: 100,
      splits: [
        {
          id: UUID.UUID(),
          size: 100
        }
      ]
    };
  }

  /** Deep find a layout by its ID */
  static findSplitByID(model: LayoutStateModel,
                       id: string): Layout {
    for (const key of Object.keys(model)) {
      const layout = this.findSplitByIDImpl(model[key], id);
      if (layout)
        return layout;
    }
    return null;
  }

  /** Deep find a layout by its ID */
  static findSplitByIDImpl(layout: Layout,
                           id: string): Layout {
    if (layout.id === id)
      return layout;
    if (layout.splits && layout.splits.length) {
      for (const inner of layout.splits) {
        const split = this.findSplitByIDImpl(inner, id);
        if (split)
          return split;
      }
    }
    return null;
  }

  /** Visit each split in a layout */
  static visitSplits(layout: Layout,
                     visitor: Function): void {
    if (layout.splits && layout.splits.length) {
      for (const inner of layout.splits) {
        visitor(inner);
        this.visitSplits(inner, visitor);
      }
    }
  }

  /** ctor */
  constructor(private termSvc: TerminalService) { }

  @Action(CloseSplit)
  closeSplit({ getState, setState }: StateContext<LayoutStateModel>,
             { payload }: CloseSplit) {
    const updated = getState();
    const split = LayoutState.findSplitByID(updated, payload.id);
    if (split) {
      // kill the terminal session we're closing
      const splat = split.splits[payload.ix];
      nextTick(() => this.termSvc.kill(splat.id));
      split.splits.splice(payload.ix, 1);
      // if we have more than one split left (or at the root level)
      // we set everyone to the same size, distributed evenly
      if (split.root || (split.splits.length > 1)) {
        const size = 100 / split.splits.length;
        split.splits.forEach(split => split.size = size);
      }
      // but if only one split left, collapse the splits
      // NOTE: the root level can't be deleted
      else {
        split.prefs = { ...split.splits[0].prefs };
        split.id = split.splits[0].id;
        delete split.direction;
        delete split.splits;
      }
    }
    setState({...updated});
  }

  @Action(MakeSplit)
  makeSplit({ getState, setState }: StateContext<LayoutStateModel>,
            { payload }: MakeSplit) {
    const updated = getState();
    const split = LayoutState.findSplitByID(updated, payload.id);
    if (split) {
      // making a split on the same axis is easy
      // we set everyone to the same size, distributed evenly
      if (split.direction === payload.direction) {
        const iy = payload.ix + (payload.before? 0 : 1);
        split.splits.splice(iy, 0, { id: UUID.UUID(), size: 0 });
        const size = 100 / split.splits.length;
        split.splits.forEach(split => split.size = size);
      }
      // but now we want to split in the opposite direction
      // we create a new sub-split, preserving IDs
      // we also set everyone to the same size, distributed evenly
      else {
        const splat = split.splits[payload.ix];
        splat.direction = payload.direction;
        const splatPrefs = { ...splat.prefs };
        splat.prefs = { };
        const splatID = splat.id;
        splat.id = UUID.UUID();
        if (payload.before) {
          splat.splits = [{ id: UUID.UUID(), size: 50 },
                          { id: splatID, prefs: splatPrefs, size: 50 }];
        }
        else {
          splat.splits = [{ id: splatID, prefs: splatPrefs, size: 50 },
                          { id: UUID.UUID(), size: 50 }];
        }
      }
    }
    setState({...updated});
  }

  @Action(NewLayout)
  newLayout({ getState, setState }: StateContext<LayoutStateModel>,
            { payload }: NewLayout) {
    const updated = getState();
    updated[payload] = LayoutState.defaultLayout();
    setState({...updated});
  }

  @Action(RemoveLayout)
  removeLayout({ getState, setState }: StateContext<LayoutStateModel>,
               { payload }: RemoveLayout) {
    const updated = getState();
    // kill every terminal session we're deleting
    const layout = updated[payload];
    LayoutState.visitSplits(layout, splat => {
      nextTick(() => this.termSvc.kill(splat.id));
    });
    delete updated[payload];
    setState({...updated});
  }

  @Action(SetPrefs)
  setPrefs({ getState, setState }: StateContext<LayoutStateModel>,
           { payload }: SetPrefs) {
    const updated = getState();
    const split = LayoutState.findSplitByID(updated, payload.id);
    if (split) {
      // NOTE: a bit convoluted as the payload may contain just some of the prefs
      split.prefs = split.prefs || { };
      Object.assign(split.prefs, payload.prefs);
    }
    setState({...updated});
  }

  @Action(SetSearch)
  setSearch({ getState, setState }: StateContext<LayoutStateModel>,
            { payload }: SetSearch) {
    const updated = getState();
    const split = LayoutState.findSplitByID(updated, payload.id);
    if (split)
      split.search = { ...payload.search };
    setState({...updated});
  }

  @Action(SetSearchWrap)
  setSearchWrap({ getState, setState }: StateContext<LayoutStateModel>,
                { payload }: SetSearchWrap) {
    const updated = getState();
    const split = LayoutState.findSplitByID(updated, payload.id);
    if (split)
      split.search.wrap = payload.wrap;
    setState({...updated});
  }

  @Action(SwapWith)
  swapWith({ getState, setState }: StateContext<LayoutStateModel>,
           { payload }: SwapWith) {
    const updated = getState();
    // NOTE: the "with" id is encoded as id[ix]
    const compound = payload.with.split(/[\[\]]/);
    const withID = compound[0];
    const ix = Number(compound[1]);
    const p = LayoutState.findSplitByID(updated, payload.id);
    const q = LayoutState.findSplitByID(updated, withID).splits[ix];
    if (p.id !== q.id) {
      // swap the layout
      p.id = q.id;
      q.id = payload.id;
      const prefs = { ...p.prefs };
      p.prefs = { ...q.prefs };
      q.prefs = prefs;
      const search = { ...p.search };
      p.search = { ...q.search };
      q.search = search;
      // swap the sessions
      this.termSvc.swap(p.id, q.id);
      setState({...updated});
    }
  }

  @Action(UpdateSplitSizes)
  updateLayout({ getState, setState }: StateContext<LayoutStateModel>,
               { payload }: UpdateSplitSizes) {
    const updated = getState();
    const split = LayoutState.findSplitByID(updated, payload.id);
    if (split)
      payload.sizes.forEach((size, ix) => split.splits[ix].size = size);
    setState({...updated});
  }

}

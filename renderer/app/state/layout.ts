import { Action } from '@ngxs/store';
import { nextTick } from 'ellib';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { TerminalService } from '../services/terminal';
import { UUID } from 'angular2-uuid';

/** NOTE: actions must come first because of AST */

export class CloseSplit {
  static readonly type = '[Layout] close split';
  constructor(public readonly payload: { splitID: string, ix: number }) { }
}

export class MakeSplit {
  static readonly type = '[Layout] make split';
  constructor(public readonly payload: { splitID: string, ix: number, direction: SplitDir, before: boolean }) { }
}

export class NewLayout {
  static readonly type = '[Layout] new layout';
  constructor(public readonly payload: { splitID: string }) { }
}

export class RemoveLayout {
  static readonly type = '[Layout] remove layout';
  constructor(public readonly payload: { splitID: string }) { }
}

export class SetPrefs {
  static readonly type = '[Layout] set prefs';
  constructor(public readonly payload: { splitID: string, prefs: LayoutPrefs }) { }
}

export class SetSearch {
  static readonly type = '[Layout] set search';
  constructor(public readonly payload: { splitID: string, search: LayoutSearch }) { }
}

export class SetSearchWrap {
  static readonly type = '[Layout] set search wrap';
  constructor(public readonly payload: { splitID: string, wrap: boolean }) { }
}

export class SwapWith {
  static readonly type = '[Layout] swap with';
  constructor(public readonly payload: { splitID: string, targetID: string }) { }
}

export class UpdateSplitSizes {
  static readonly type = '[Layout] update split sizes';
  constructor(public readonly payload: { splitID: string, sizes: number[] }) { }
}

export type SplitDir = 'horizontal' | 'vertical';

export interface Layout {
  direction?: SplitDir;
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
  [tab: string]: Layout;
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
      const layout = LayoutState.findSplitByIDImpl(model[key], id);
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
        const split = LayoutState.findSplitByIDImpl(inner, id);
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
        LayoutState.visitSplits(inner, visitor);
      }
    }
  }

  /** ctor */
  constructor(private termSvc: TerminalService) { }

  @Action(CloseSplit)
  closeSplit({ getState, setState }: StateContext<LayoutStateModel>,
             { payload }: CloseSplit) {
    const { splitID, ix } = payload;
    const state = getState();
    const split = LayoutState.findSplitByID(state, splitID);
    if (split) {
      // kill the terminal session we're closing
      const splat = split.splits[ix];
      nextTick(() => this.termSvc.kill(splat.id));
      split.splits.splice(ix, 1);
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
    setState({ ...state });
  }

  @Action(MakeSplit)
  makeSplit({ getState, setState }: StateContext<LayoutStateModel>,
            { payload }: MakeSplit) {
    const { splitID, ix, direction, before } = payload;
    const state = getState();
    const split = LayoutState.findSplitByID(state, splitID);
    if (split) {
      // making a split on the same axis is easy
      // we set everyone to the same size, distributed evenly
      if (split.direction === direction) {
        const iy = ix + (before? 0 : 1);
        split.splits.splice(iy, 0, { id: UUID.UUID(), size: 0 });
        const size = 100 / split.splits.length;
        split.splits.forEach(split => split.size = size);
      }
      // but now we want to split in the opposite direction
      // we create a new sub-split, preserving IDs
      // we also set everyone to the same size, distributed evenly
      else {
        const splat = split.splits[ix];
        splat.direction = direction;
        const splatPrefs = { ...splat.prefs };
        splat.prefs = { };
        const splatID = splat.id;
        splat.id = UUID.UUID();
        if (before) {
          splat.splits = [{ id: UUID.UUID(), size: 50 },
                          { id: splatID, prefs: splatPrefs, size: 50 }];
        }
        else {
          splat.splits = [{ id: splatID, prefs: splatPrefs, size: 50 },
                          { id: UUID.UUID(), size: 50 }];
        }
      }
    }
    setState({ ...state });
  }

  @Action(NewLayout)
  newLayout({ patchState }: StateContext<LayoutStateModel>,
            { payload }: NewLayout) {
    const { splitID } = payload;
    patchState({ [splitID]: LayoutState.defaultLayout() });
  }

  @Action(RemoveLayout)
  removeLayout({ getState, setState }: StateContext<LayoutStateModel>,
               { payload }: RemoveLayout) {
    const { splitID } = payload;
    const state = getState();
    // kill every terminal session we're deleting
    const layout = state[splitID];
    LayoutState.visitSplits(layout, splat => {
      nextTick(() => this.termSvc.kill(splat.id));
    });
    delete state[splitID];
    setState({ ...state });
  }

  @Action(SetPrefs)
  setPrefs({ getState, setState }: StateContext<LayoutStateModel>,
           { payload }: SetPrefs) {
    const { splitID, prefs } = payload;
    const state = getState();
    const split = LayoutState.findSplitByID(state, splitID);
    if (split) {
      // NOTE: a bit convoluted as the payload may contain just some of the prefs
      const orig = split.prefs || { };
      split.prefs = { ...orig, ...prefs};
    }
    setState({ ...state });
  }

  @Action(SetSearch)
  setSearch({ getState, setState }: StateContext<LayoutStateModel>,
            { payload }: SetSearch) {
    const { splitID, search } = payload;
    const state = getState();
    const split = LayoutState.findSplitByID(state, splitID);
    if (split) {
      const orig = split.search || { };
      split.search = { ...orig, ...search };
    }
    setState({ ...state });
  }

  @Action(SetSearchWrap)
  setSearchWrap({ getState, setState }: StateContext<LayoutStateModel>,
                { payload }: SetSearchWrap) {
    const { splitID, wrap } = payload;
    const state = getState();
    const split = LayoutState.findSplitByID(state, splitID);
    if (split)
      split.search = { ...split.search, wrap };
    setState({ ...state });
  }

  @Action(SwapWith)
  swapWith({ getState, setState }: StateContext<LayoutStateModel>,
           { payload }: SwapWith) {
    const { splitID, targetID } = payload;
    const state = getState();
    // NOTE: the targetID is encoded as id[ix]
    const compound = targetID.split(/[\[\]]/);
    const withID = compound[0];
    const ix = Number(compound[1]);
    const p = LayoutState.findSplitByID(state, splitID);
    const q = LayoutState.findSplitByID(state, withID).splits[ix];
    if (p.id !== q.id) {
      // swap the layout
      p.id = q.id;
      q.id = splitID;
      const prefs = { ...p.prefs };
      p.prefs = { ...q.prefs };
      q.prefs = prefs;
      const search = { ...p.search };
      p.search = { ...q.search };
      q.search = search;
      // swap the sessions
      this.termSvc.swap(p.id, q.id);
      setState({ ...state });
    }
  }

  @Action(UpdateSplitSizes)
  updateLayout({ getState, setState }: StateContext<LayoutStateModel>,
               { payload }: UpdateSplitSizes) {
    const { splitID, sizes } = payload;
    const state = getState();
    const split = LayoutState.findSplitByID(state, splitID);
    if (split)
      sizes.forEach((size, ix) => split.splits[ix].size = size);
    setState({ ...state });
  }

}

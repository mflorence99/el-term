import { Action, State, StateContext } from '@ngxs/store';

import { UUID } from 'angular2-uuid';

/** NOTE: actions must come first because of AST */

export class CloseSplit {
  constructor(public readonly payload: {id: string, ix: number}) { }
}

export class MakeSplit {
  constructor(public readonly payload:
    {id: string, ix: number, direction: 'horizontal' | 'vertical', before: boolean}) { }
}

export class NewLayout {
  constructor(public readonly payload: string) { }
}

export class RemoveLayout {
  constructor(public readonly payload: string) { }
}

export class SetBadge {
  constructor(public readonly payload: {id: string, ix: number, badge: string}) { }
}

export class SwapWith {
  constructor(public readonly payload: {id: string, with: string}) { }
}

export class UpdateSplitSizes {
  constructor(public readonly payload: {id: string, sizes: number[]}) { }
}

export interface Layout {
  badge?: string;
  direction?: 'horizontal' | 'vertical';
  id: string;
  root?: boolean;
  size: number;
  splits?: Layout[];
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
  private static defaultLayout(): Layout {
    return {
      direction: 'vertical',
      id: UUID.UUID(),
      root: true,
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
  private static findSplitByID(model: LayoutStateModel,
                               id: string): Layout {
    for (const key of Object.keys(model)) {
      const layout = this.findSplitByIDImpl(model[key], id);
      if (layout)
        return layout;
    }
    return null;
  }

  /** Deep find a layout by its ID */
  private static findSplitByIDImpl(layout: Layout,
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

  @Action(CloseSplit)
  closeSplit({ getState, setState }: StateContext<LayoutStateModel>,
             { payload }: CloseSplit) {
    const updated = getState();
    const split = LayoutState.findSplitByID(updated, payload.id);
    if (split) {
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
        const splatID = splat.id;
        splat.id = UUID.UUID();
        if (payload.before) {
          splat.splits = [{ id: UUID.UUID(), size: 50 },
                          { id: splatID, size: 50 }];
        }
        else {
          splat.splits = [{ id: splatID, size: 50 },
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
    delete updated[payload];
    setState({...updated});
  }

  @Action(SetBadge)
  setBadge({ getState, setState }: StateContext<LayoutStateModel>,
          { payload }: SetBadge) {
    const updated = getState();
    const split = LayoutState.findSplitByID(updated, payload.id);
    if (split)
      split.splits[payload.ix].badge = payload.badge;
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
    p.id = q.id;
    q.id = payload.id;
    setState({...updated});
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

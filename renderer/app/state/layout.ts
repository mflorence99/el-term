import { Action, State, StateContext } from '@ngxs/store';

import { toHex } from 'ellib/lib/utils';

/** NOTE: actions must come first because of AST */

export class CloseSplit {
  constructor(public readonly payload: {id: string, ix: number}) { }
}

export class MakeSplit {
  constructor(public readonly payload:
    {id: string, ix: number, direction: 'horizontal' | 'vertical', before: boolean}) { }
}

export class SwapWith {
  constructor(public readonly payload: {id: string, with: string}) { }
}

export class UpdateSplitSizes {
  constructor(public readonly payload: {id: string, sizes: number[]}) { }
}

export interface LayoutStateModel {
  direction?: 'horizontal' | 'vertical';
  id: string;
  root?: boolean;
  size: number;
  splits?: LayoutStateModel[];
}

@State<LayoutStateModel>({
  name: 'layout',
  defaults: {
    direction: 'vertical',
    id: LayoutState.makeID(),
    root: true,
    size: 100,
    splits: [
      {
        id: LayoutState.makeID(),
        size: 100
      }
    ]
  }
}) export class LayoutState {

  /** Deep find a layout by its ID */
  static findSplitByID(model: LayoutStateModel,
                       id: string): LayoutStateModel {
    if (model.id === id)
      return model;
    if (model.splits && model.splits.length) {
      for (const inner of model.splits) {
        const split = this.findSplitByID(inner, id);
        if (split)
          return split;
      }
    }
    return null;
  }

  /** Make an unique ID */
  static makeID(): string {
    return toHex(Math.trunc(Math.random() * 100000000), 2);
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
        split.splits.splice(iy, 0, { id: LayoutState.makeID(), size: 0 });
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
        splat.id = LayoutState.makeID();
        if (payload.before) {
          splat.splits = [{ id: LayoutState.makeID(), size: 50 },
                          { id: splatID, size: 50 }];
        }
        else {
          splat.splits = [{ id: splatID, size: 50 },
                          { id: LayoutState.makeID(), size: 50 }];
        }
      }
    }
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

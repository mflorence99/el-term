import { CloseSplit, LayoutPrefs, LayoutState, MakeSplit } from '../../state/layout';
import { Component, ViewChild } from '@angular/core';

import { ContextMenuComponent } from 'ngx-contextmenu';
import { DrawerPanelComponent } from 'ellib';
import { SplittableComponent } from '../../components/splittable';
import { Store } from '@ngxs/store';
import { Tab } from '../../state/tabs';

/**
 * EL-Term Root
 */

@Component({
  selector: 'elterm-root',
  templateUrl: 'page.html',
  styleUrls: ['page.scss']
})

export class RootPageComponent {

  @ViewChild(ContextMenuComponent) contextMenu: ContextMenuComponent;
  @ViewChild(SplittableComponent) splittable: SplittableComponent;

  @ViewChild('prefsDrawer') prefsDrawer: DrawerPanelComponent;
  @ViewChild('tabDrawer') tabDrawer: DrawerPanelComponent;

  editPrefs = { } as LayoutPrefs;
  editPrefsID: string;
  editTab = { } as Tab;
  swapWith: string;

  /** ctor */
  constructor(private store: Store) { }

  /** Is the close menu enabled? */
  isCloseEnabled(item: {id: string, ix: number}): boolean {
    return (item.id !== this.splittable.layout.id)
        || (this.splittable.layout.splits.length > 1);
  }

  /** Is the swap menu enabled? */
  isSwapEnabled(item: {id: string, ix: number}): boolean {
    return this.isCloseEnabled(item);
  }

  // event handlers

  onContextMenu(event: {event: MouseEvent,
                        item: {id: string, ix: number}},
                command: string): void {
    const actions = [];
    const id = event.item.id;
    const ix = event.item.ix;
    switch (command) {
      case 'prefs':
      const layout = LayoutState.findSplitByIDImpl(this.splittable.layout, id);
        this.editPrefs = layout.splits[ix].prefs;
        this.editPrefsID = layout.splits[ix].id;
        this.prefsDrawer.open();
        break;
      case 'swapWith':
        this.swapWith = `${id}[${ix}]`;
        break;
      case 'vertical-':
        actions.push(new MakeSplit({ id, ix, direction: 'vertical', before: true }));
        break;
      case 'vertical+':
        actions.push(new MakeSplit({ id, ix, direction: 'vertical', before: false }));
        break;
      case 'horizontal-':
        actions.push(new MakeSplit({ id, ix, direction: 'horizontal', before: true }));
        break;
      case 'horizontal+':
        actions.push(new MakeSplit({ id, ix, direction: 'horizontal', before: false }));
        break;
      case 'close':
        actions.push(new CloseSplit({ id, ix }));
        break;
    }
    // dispatch action
    if (actions.length > 0)
      this.store.dispatch(actions);
  }

  onEditTab(tab: Tab) {
    this.editTab = tab;
    this.tabDrawer.open();
  }

}

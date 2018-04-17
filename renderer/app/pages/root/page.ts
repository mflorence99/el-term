import { CloseSplit, Layout, LayoutPrefs, LayoutState, MakeSplit } from '../../state/layout';
import { Component, ViewChild } from '@angular/core';

import { ContextMenuComponent } from 'ngx-contextmenu';
import { DrawerPanelComponent } from 'ellib';
import { ElectronService } from 'ngx-electron';
import { SplittableComponent } from '../../components/splittable';
import { Store } from '@ngxs/store';
import { Tab } from '../../state/tabs';
import { TerminalService } from '../../services/terminal';
import { nextTick } from 'ellib';

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
  constructor(private electron: ElectronService,
              private termSvc: TerminalService,
              private store: Store) { }

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
      case 'bashrc':
        const process = this.electron.process;
        LayoutState.visitSplits(this.splittable.layout, (split: Layout) => {
          this.termSvc.writeln(split.id, `source ${process.env['HOME']}/.bashrc`);
        });
        break;
      case 'ctrl+c':
        LayoutState.visitSplits(this.splittable.layout, (split: Layout) => {
          this.termSvc.ctrl_c(split.id);
        });
        break;
      case 'clear':
        LayoutState.visitSplits(this.splittable.layout, (split: Layout) => {
          this.termSvc.ctrl_c(split.id);
          // TODO: this isn't 100% reliable and the clear can be ignored if
          // the CTRL+C hasn't completed yet
          nextTick(() => this.termSvc.writeln(split.id, 'clear'));
        });
        break;
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

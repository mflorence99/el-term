import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContextMenuComponent } from 'ngx-contextmenu';
import { DndDropEvent } from 'ngx-drag-drop';
import { Input } from '@angular/core';
import { MoveTab } from '../state/tabs';
import { NewTab } from '../state/tabs';
import { RemoveTab } from '../state/tabs';
import { RootPageComponent } from '../pages/root/page';
import { SelectTab } from '../state/tabs';
import { Store } from '@ngxs/store';
import { Tab } from '../state/tabs';
import { TabsStateModel } from '../state/tabs';
import { ViewChild } from '@angular/core';

import { nextTick } from 'ellib';

/**
 * Tabs component
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'elterm-tabs',
  templateUrl: 'tabs.html',
  styleUrls: ['tabs.scss']
})

export class TabsComponent {

  @Input() tabs = { } as TabsStateModel;
  @Input() tabIndex: number;

  @ViewChild(ContextMenuComponent) contextMenu: ContextMenuComponent;

  /** ctor */
  constructor(private root: RootPageComponent,
              private store: Store) { }

  /** Is this tab removeable? */
  isTabRemoveable(tab: Tab): boolean {
    return !tab.permanent;
  }

  // event handlers

  onExecute(event: {event?: MouseEvent,
                    item: Tab},
            command: string): void {
    const tab = event.item;
    switch (command) {
      case 'edit':
        this.root.onEditTab(tab);
        break;
      case 'remove':
        // NOTE: we need to make sure a tab is selected after we delete
        // one that itself may have been selected -- we also delay removal
        // so this component can clean up first
        nextTick(() => this.store.dispatch(new RemoveTab({ tab })));
        break;
    }
  }

  onMoveTab(event: DndDropEvent,
            ix: number) {
    const tab = event.data;
    this.store.dispatch([
      new MoveTab({ tab, ix }),
      new SelectTab({ tab })
    ]);
  }

  onNewTab() {
    this.store.dispatch(new NewTab());
  }

  onTabSelect(ix: number) {
    this.store.dispatch(new SelectTab({ tab: this.tabs.tabs[ix] }));
  }

}

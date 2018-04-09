import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MoveTab, NewTab, Tab, TabsStateModel } from '../state/tabs';

import { SelectTab } from '../state/tabs';
import { Store } from '@ngxs/store';

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

  @Input() tabs: TabsStateModel;
  @Input() tabIndex: number;

  @Output() editTab = new EventEmitter<Tab>();

  /** ctor */
  constructor(private store: Store) { }

  // event handlers

  onEditTab(event: MouseEvent,
            tab: Tab) {
    this.editTab.emit(tab);
    event.stopPropagation();
  }

  onMoveTab(tab: Tab,
            ix: number) {
    this.store.dispatch(new MoveTab({ tab, ix }));
  }

  onNewTab() {
    this.store.dispatch(new NewTab());
  }

  onTabSelect(ix: number) {
    this.store.dispatch(new SelectTab(this.tabs.tabs[ix]));
  }

}

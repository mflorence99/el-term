import { Component, ViewChild } from '@angular/core';

import { CloseSplit } from '../../state/layout';
import { ContextMenuComponent } from 'ngx-contextmenu';
import { MakeSplit } from '../../state/layout';
import { SplittableComponent } from '../../components/splittable';
import { Store } from '@ngxs/store';

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

  swapWith: string;

  /** Is the close menu enabled? */
  isCloseEnabled(item: {id: string, ix: number}): boolean {
    return (item.id !== this.splittable.layout.id)
        || (this.splittable.layout.splits.length > 1);
  }

  /** ctor */
  constructor(private store: Store) { }

  /** Handle context menu */
  onContextMenu(event: {event: MouseEvent,
                        item: {id: string, ix: number}},
                command: string): void {
    const actions = [];
    const id = event.item.id;
    const ix = event.item.ix;
    switch (command) {
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

}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ContextMenuComponent } from 'ngx-contextmenu';
import { Layout } from '../state/layout';
import { Store } from '@ngxs/store';
import { Tab } from '../state/tabs';
import { UpdateSplitSizes } from '../state/layout';
import { debounce } from 'ellib';

/**
 * Splittable component
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'elterm-splittable',
  templateUrl: 'splittable.html',
  styleUrls: ['splittable.scss']
})

export class SplittableComponent {

  @Input() layout = { } as Layout;
  @Input() menu: ContextMenuComponent;
  @Input() swapWith: string;
  @Input() tab = { } as Tab;

  private updateSplitSizes: Function;

  /** ctor */
  constructor(private store: Store) {
    this.updateSplitSizes = debounce(this._updateSplitSizes, 500);
  }

  // event handlers

  onSplitSizeChange(event: {gutterNum: number,
                            sizes: number[]}): void {
    this.updateSplitSizes(this.layout.id, event.sizes);
  }

  // private methods

  private _updateSplitSizes(splitID: string,
                            sizes: number[]): void {
    this.store.dispatch(new UpdateSplitSizes({splitID, sizes}));
  }

}

import { ChangeDetectionStrategy, Component, HostBinding, HostListener, Input } from '@angular/core';

import { RootPageComponent } from '../pages/root/page';
import { Store } from '@ngxs/store';
import { SwapWith } from '../state/layout';
import { Tab } from '../state/tabs';

/**
 * Pane component
 */

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  selector: 'elterm-pane',
  templateUrl: 'pane.html',
  styleUrls: ['pane.scss']
})

export class PaneComponent {

  @HostBinding('class.swapping') isSwapping: boolean;

  @Input() badge: string;
  @Input() sessionID: string;
  @Input() swapWith: string;
  @Input() tab: Tab;

  /** ctor */
  constructor(private root: RootPageComponent,
              private store: Store) { }

  // listeners

  @HostListener('click') onClick() {
    if (this.isSwapping) {
      this.store.dispatch(new SwapWith({ id: this.sessionID, with: this.swapWith }));
      this.isSwapping = false;
      this.root.swapWith = null;
    }
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.isSwapping = !!this.swapWith;
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.isSwapping = false;
  }

}

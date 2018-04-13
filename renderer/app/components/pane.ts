import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core';
import { LayoutPrefs, SwapWith } from '../state/layout';

import { RootPageComponent } from '../pages/root/page';
import { Store } from '@ngxs/store';
import { Tab } from '../state/tabs';
import { TerminalService } from '../services/terminal';
import { debounce } from 'ellib';

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

  @Input() prefs = { } as LayoutPrefs;
  @Input() sessionID: string;
  @Input() swapWith: string;
  @Input() tab: Tab;

  onResized: Function;
  swapping: boolean;

  /** ctor */
  constructor(private root: RootPageComponent,
              private store: Store,
              private termSvc: TerminalService) {
    this.onResized = debounce((event: { newWidth, newHeight }) => {
      this.termSvc.resize(this.sessionID, event.newWidth, event.newHeight);
    }, 250);
  }

  // listeners

  @HostListener('click') onClick() {
    if (this.swapping) {
      this.store.dispatch(new SwapWith({ id: this.sessionID, with: this.swapWith }));
      this.swapping = false;
      this.root.swapWith = null;
    }
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.swapping = !!this.swapWith;
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.swapping = false;
  }

}

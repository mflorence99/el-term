import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DndDropEvent } from 'ngx-drag-drop';
import { HostListener } from '@angular/core';
import { Input } from '@angular/core';
import { LayoutPrefs } from '../state/layout';
import { LayoutSearch } from '../state/layout';
import { RootPageComponent } from '../pages/root/page';
import { Store } from '@ngxs/store';
import { SwapWith } from '../state/layout';
import { Tab } from '../state/tabs';
import { TerminalService } from '../services/terminal';

import { config } from '../config';
import { debounce } from 'ellib';

/**
 * Pane component
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'elterm-pane',
  templateUrl: 'pane.html',
  styleUrls: ['pane.scss']
})

export class PaneComponent {

  @Input() index: number;
  @Input() prefs = { } as LayoutPrefs;
  @Input() search = { } as LayoutSearch;
  @Input() sessionID: string;
  @Input() swapWith: string;
  @Input() tab: Tab;

  focused = false;
  swapping = false;

  onResized: Function;

  /** ctor */
  constructor(private root: RootPageComponent,
              private store: Store,
              private termSvc: TerminalService) {
    this.onResized = debounce((event: { newWidth, newHeight }) => {
      this.termSvc.resize(this.sessionID, { width: event.newWidth, height: event.newHeight });
    }, config.resizePaneThrottle);
  }

  // event handlers

  onDrop(event: DndDropEvent): void {
    console.log(event.event.dataTransfer.files);
    if (event.isExternal && (event.event.dataTransfer.files.length > 0)) {
      const file = event.event.dataTransfer.files.item(0);
      if (file.path) {
        this.termSvc.focus(this.sessionID);
        this.termSvc.write(this.sessionID, `'${file.path}'`);
      }
    }
  }

  // listeners

  @HostListener('click') onClick() {
    if (this.swapping) {
      this.store.dispatch(new SwapWith({ splitID: this.sessionID, targetID: this.swapWith }));
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

import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { LayoutPrefs, LayoutSearch } from '../state/layout';

import { TerminalService } from '../services/terminal';

/**
 * Terminal component
 */

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  selector: 'elterm-terminal',
  templateUrl: 'terminal.html',
  styleUrls: ['terminal.scss']
})

export class TerminalComponent implements AfterViewInit, OnDestroy {

  @Input() prefs = { } as LayoutPrefs;
  @Input() search = { } as LayoutSearch;
  @Input() sessionID: string;

  @ViewChild('xterm') xterm: ElementRef;

  /** ctor */
  constructor(private termSvc: TerminalService) { }

  // lifecycle methods

  ngAfterViewInit() {
    this.termSvc.connect(this.sessionID, this.prefs || { }, this.xterm.nativeElement);
  }

  ngOnDestroy() {
    this.termSvc.disconnect(this.sessionID);
  }

}

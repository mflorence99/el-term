import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';

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

  @Input() sessionID: string;

  @ViewChild('xterm') xterm: ElementRef;

  /** ctor */
  constructor(private termSvc: TerminalService) { }

  // lifecycle methods

  ngAfterViewInit() {
    this.termSvc.connect(this.sessionID, this.xterm.nativeElement);
  }

  ngOnDestroy() {
    this.termSvc.disconnect(this.sessionID);
  }

}

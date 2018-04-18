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
    this.termSvc.connect(this.sessionID,
                         this.prefs || { },
                         this.xterm.nativeElement,
                         this.dataHandler.bind(this));
  }

  ngOnDestroy() {
    this.termSvc.disconnect(this.sessionID);
  }

  // private methods

  private dataHandler(data: string): string {
    // NOTE: redundant escapes in an attempt at eliminating ambiguity
    const pfx = '\u001B[30;43;30m';
    const sfx = '\u001B[27;27m';
    if (this.search && this.search.str && (this.search.str.length > 0)) {
      const highlighted = `${pfx}${this.search.str}${sfx}`;
      data = data.replace(RegExp(this.search.str, 'g'), highlighted);
    }
    else {
      // TODO: this doesn't really work, because we are only looking at NEW
      // data sent to the terminal
      const r_pfx = pfx.replace('[', '\\[');
      const r_sfx = sfx.replace('[', '\\[');
      const unhighlighted = `${r_pfx}([^\u001b]+)${r_sfx}`;
      data = data.replace(RegExp(unhighlighted, 'g'), '$1');
    }
    return data;
  }

}

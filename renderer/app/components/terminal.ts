import { AfterViewInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { CloseSplit } from '../state/layout';
import { Component } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ElementRef } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Input } from '@angular/core';
import { LayoutPrefs } from '../state/layout';
import { LayoutSearch } from '../state/layout';
import { NgZone } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { Output } from '@angular/core';
import { PaneComponent } from '../components/pane';
import { RootPageComponent } from '../pages/root/page';
import { SetPrefs } from '../state/layout';
import { SplittableComponent } from '../components/splittable';
import { Store } from '@ngxs/store';
import { TerminalService } from '../services/terminal';
import { ViewChild } from '@angular/core';

import { nextTick } from 'ellib';

/**
 * Terminal component
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'elterm-terminal',
  templateUrl: 'terminal.html',
  styleUrls: ['terminal.scss']
})

export class TerminalComponent implements AfterViewInit, OnDestroy {

  @Input() prefs = { } as LayoutPrefs;
  @Input() search = { } as LayoutSearch;
  @Input() sessionID: string;

  @Output() focus = new EventEmitter<boolean>();

  @ViewChild('xterm', { static: true }) xterm: ElementRef;

  /** ctor */
  constructor(private electron: ElectronService,
              private pane: PaneComponent,
              private root: RootPageComponent,
              private splittable: SplittableComponent,
              private store: Store,
              private termSvc: TerminalService,
              private zone: NgZone) { }

  // lifecycle methods

  ngAfterViewInit() {
    // NOTE: we do this to make sure that the Roboto Mono font load is complete
    // https://github.com/mflorence99/el-term/issues/8
    // https://github.com/xtermjs/xterm.js/issues/1164
    nextTick(() => {
      this.termSvc.connect(this.sessionID,
                           this.prefs || { },
                           this.xterm.nativeElement,
                           this.dataHandler.bind(this),
                           this.focusHandler.bind(this),
                           this.keyHandler.bind(this),
                           this.titleHandler.bind(this),
                           this.scrollHandler.bind(this));
    });
  }

  ngOnDestroy() {
    this.termSvc.disconnect(this.sessionID);
  }

  // private methods

  private dataHandler(data: string): string {
    const pfx = '\u001B[30;43m';
    const sfx = '\u001B[0m';
    if (this.search && this.search.str && (this.search.str.length > 0)) {
      const highlighted = `${pfx}${this.search.str}${sfx}`;
      data = data.replace(RegExp(this.search.str, 'gi'), highlighted);
    }
    return data;
  }

  private focusHandler(focused: boolean): void {
    // TODO: see https://github.com/angular/angular/issues/17572
    // we are violating one-way data flow and a child (this) changes the state
    // of a parent -- we used to code an EventEmitter here but given that
    // we're off-track anyway, let's just hack in the change
    this.zone.run(() => this.focus.emit(focused));
  }

  private keyHandler(event: KeyboardEvent): void {
    this.zone.run(() => {
      if (event.ctrlKey && event.code === 'KeyR') {
        const win = this.electron.remote.getCurrentWindow();
        win.webContents.reload();
      }
      // NOTE: as little tricky as we have to close on the parent
      else if (event.ctrlKey && event.code === 'KeyP')
        this.root.onExecute({item: { id: this.splittable.layout.id,
                                         ix: this.pane.index } }, 'prefs');
      else if (event.ctrlKey && event.code === 'KeyF')
        this.root.onExecute({item: { id: this.splittable.layout.id,
                                         ix: this.pane.index } }, 'search');
      else if (event.ctrlKey && event.code === 'KeyW')
        this.store.dispatch(new CloseSplit({ splitID: this.splittable.layout.id,
                                             ix: this.pane.index }));
    });
  }

  private titleHandler(title: string): void {
    this.zone.run(() => {
      this.store.dispatch(new SetPrefs({ splitID: this.sessionID, prefs: { title } }));
    });
  }

  private scrollHandler(y: number): void {
    this.zone.run(() => {
      this.termSvc.scrollPos(this.sessionID, y);
    });
  }

}

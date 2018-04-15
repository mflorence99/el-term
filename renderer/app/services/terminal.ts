import { Injectable, OnDestroy } from '@angular/core';

import { ElectronService } from 'ngx-electron';
import { LayoutPrefs } from '../state/layout';
import { Terminal } from 'xterm';
import { nextTick } from 'ellib';

const initialCols = 80;
const initialRows = 24;
const padding = 16;

/**
 * Encapsulates xterm <==> node-pty communication
 */

@Injectable()
export class TerminalService implements OnDestroy {

  private static sessions: { [sessionID: string]: Session } = { };

  private nodePty: { spawn: Function };
  private os: { platform: Function };

  /** ctor */
  constructor(private electron: ElectronService) {
    this.os = this.electron.remote.require('os');
    this.nodePty = this.electron.remote.require('node-pty');
  }

  /** Connect to a session */
  connect(sessionID: string,
          prefs: LayoutPrefs,
          element: HTMLElement): Terminal {
    const session = this.get(sessionID);
    // configure a new Terminal if one doesn't exist already
    if (!session.term) {
      session.term = new Terminal({
        // NOTE: I think there's a bug where this object is NOT r/o!
        cols: initialCols,
        rows: initialRows,
        fontFamily: 'Roboto Mono',
        fontSize: 12,
        theme: {
          background: '#212121', // var(--mat-grey-900)
          foreground: '#f5f5f5'  // var(--mat-grey-100)
        }
      });
      // connect to DOM
      session.term.open(element);
      session.term.focus();
      session.term.element.style.padding = `${padding}px`;
      // NOTE: see https://github.com/xtermjs/xterm.js/#importing
      (<any>session.term).fit();
      session.element = element;
    }
    // otherwise wire up previously disconnected nodes
    else {
      const pp = element.parentNode;
      pp.insertBefore(session.element, element);
      element.remove();
    }
    // connect to pty
    if (!session.pty) {
      const process = this.electron.process;
      // replace ~ for $HOME with actual home directory
      let cwd = process.cwd();
      if (prefs.directory) {
        const home = process.env['HOME'];
        cwd = prefs.directory
          .replace(/^~/, home)
          .replace(/^\$HOME/, home);
      }
      // launch node-pty over real terminal
      const shell = process.env[this.os.platform() === 'win32'? 'COMSPEC' : 'SHELL'];
      session.pty = this.nodePty.spawn(shell, [], {
        cols: initialCols,
        cwd: cwd,
        env: process.env,
        name: 'xterm-256color',
        rows: initialRows
      });
    }
    // now wire them together
    if (!session.term2pty) {
      session.term2pty = data => session.pty.write(data);
      session.term.on('data', session.term2pty);
    }
    if (!session.pty2term) {
      session.pty2term = data => session.term.write(data);
      session.pty.addListener('data', session.pty2term);
      if (prefs.startup)
        session.pty.write(`${prefs.startup}\n`);
    }
    // force a resize because we changed from the default font
    nextTick(() => {
      const p = session.element.parentElement;
      this.resize(sessionID, p.clientWidth, p.clientHeight);
    });
    return session.term;
  }

  /** Delete a session */
  delete(sessionID: string): void {
    delete TerminalService.sessions[sessionID];
  }

  /** Disconnect from session */
  disconnect(sessionID: string): void {
    const session = this.get(sessionID);
    if (session.element) {
      const pp = session.element.parentNode;
      pp.removeChild(session.element);
    }
  }

  /** Get a session */
  get(sessionID: string): Session {
    let session = TerminalService.sessions[sessionID];
    if (!session) {
      session = { } as Session;
      TerminalService.sessions[sessionID] = session;
    }
    return session;
  }

  /** Kill a pty terminal */
  kill(sessionID: string): void {
    const session = this.get(sessionID);
    if (session.pty) {
      session.pty.removeListener('data', session.pty2term);
      session.pty.kill();
    }
    if (session.term) {
      session.term.off('data', session.term2pty);
      session.term.destroy();
    }
    this.delete(sessionID);
  }

  /** Resize session window */
  resize(sessionID: string,
         width: number,
         height: number): void {
    const session = this.get(sessionID);
    if (session.pty
     && session.term
     && (<any>session.term).renderer
     && (<any>session.term).viewport) {
      // TODO: don't really know how to make this calculation work,
      // especially for height/rows -- pty seems to have some row calculation
      // hidden factor
      const dims = (<any>session.term).renderer.dimensions;
      const cols = Math.max(Math.round((width - (2 * padding)) / dims.actualCellWidth), 1);
      const rows = Math.max(Math.round((height - (2 * padding)) / dims.actualCellHeight), 1) - 3;
      // log size nicely because we refer to it all the time
      console.groupCollapsed(`%cTerminal session ${sessionID}`, `color: #0b8043`);
        console.table({
          width: {pixels: width, padding: padding, cell: dims.actualCellWidth},
          height: {pixels: height, padding: padding, cell: dims.actualCellHeight}
        });
      console.groupEnd();
      // finally ready to set rows, cols
      session.term.resize(cols, rows);
      session.pty.resize(cols, rows);
    }
  }

  /** Swap one terminal with another */
  swap(sessionID: string,
       withID: string): void {
    if (sessionID !== withID) {
      const p = this.get(sessionID);
      const q = this.get(withID);
      if (p.element && q.element) {
        // see https://stackoverflow.com/questions/9732624/
        //       how-to-swap-dom-child-nodes-in-javascript
        const pp = p.element.parentNode;
        let pt = document.createElement('span');
        pp.insertBefore(pt, p.element);
        const pq = q.element.parentNode;
        const qt = document.createElement('span');
        pq.insertBefore(qt, q.element);
        pp.insertBefore(q.element, pt);
        pq.insertBefore(p.element, qt);
        // clean up
        pp.removeChild(pt);
        pq.removeChild(qt);
        // swap the elements
        pt = p.element;
        p.element = q.element;
        q.element = pt;
        // force a resize because we changed from the default font
        nextTick(() => {
          const ppe = p.element.parentElement;
          this.resize(sessionID, ppe.clientWidth, ppe.clientHeight);
          const pqe = q.element.parentElement;
          this.resize(withID, pqe.clientWidth, pqe.clientHeight);
        });
      }
    }
  }

  // lifecycle methods

  ngOnDestroy() {
    // TODO: this doesn't really work as Angular seems to get shut down
    // by Electron before it can call lifecycle methods
    Object.keys(TerminalService.sessions).forEach(sessionID => {
      const session = this.get(sessionID);
      if (session.pty)
        session.pty.kill();
    });
  }

}

/**
 * Model the xterm <==> node-pty session management
 */

interface Session {

  element: HTMLElement;

  pty: any;
  term: Terminal;

  pty2term(data: any): void;
  term2pty(data: any): void;

}

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
  private psTree: Function;

  /** ctor */
  constructor(private electron: ElectronService) {
    this.nodePty = this.electron.remote.require('node-pty');
    this.os = this.electron.remote.require('os');
    this.psTree = this.electron.remote.require('ps-tree');
  }

  /** CTRL+C a session */
  ctrl_c(sessionID: string): void {
    const session = this.get(sessionID);
    if (session.pty) {
      const process = this.electron.process;
      this.psTree(session.pty.pid, (err, children) => {
        children.forEach(child => {
          process.kill(child.PID, 'SIGINT');
          console.log(`%cctrl_c('${sessionID}') %c${child.COMMAND}`, `color: #d32f2f`, `color: black`);
        });
      });
    }
  }

  /** Connect to a session */
  connect(sessionID: string,
          prefs: LayoutPrefs,
          element: HTMLElement): Terminal {
    const session = this.get(sessionID);
    console.groupCollapsed(`%cconnect('${sessionID}')`, `color: #5d4037`);
    // configure a new Terminal if one doesn't exist already
    this.connect2term(session, prefs, element);
    this.connect2pty(session, prefs);
    // now wire them together
    if (!session.term2pty) {
      session.term2pty = data => session.pty.write(data);
      session.term.on('data', session.term2pty);
    }
    if (!session.pty2term) {
      session.pty2term = data => session.term.write(data);
      session.pty.addListener('data', session.pty2term);
      if (prefs.startup) {
        session.pty.write(`${prefs.startup}\n`);
        console.log(`%cStart commands %c${prefs.startup.replace(/[\n\r]/g, ', ')}`, 'color: black', 'color: gray');
      }
    }
    console.groupEnd();
    // force a resize because we changed from the default font
    nextTick(() => {
      const p = session.element.parentElement;
      this.resize(sessionID, { width: p.clientWidth, height: p.clientHeight });
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
      console.log(`%cdisconnect('${sessionID}')`, `color: #c2185b`);
    }
  }

  /** Get a session */
  get(sessionID: string): Session {
    let session = TerminalService.sessions[sessionID];
    if (!session) {
      session = { id: sessionID } as Session;
      TerminalService.sessions[sessionID] = session;
    }
    return session;
  }

  /** Kill a pty terminal */
  kill(sessionID: string): void {
    const session = this.get(sessionID);
    if (session.pty) {
      session.pty.removeListener('data', session.pty2term);
      session.pty.destroy();
    }
    if (session.term) {
      session.term.off('data', session.term2pty);
      session.term.destroy();
    }
    this.delete(sessionID);
    console.log(`%ckill('${sessionID}')`, `color: #3367d6`);
  }

  /** Resize session window */
  resize(sessionID: string,
         size: {width?, height?, rows?, cols?}): void {
    const session = this.get(sessionID);
    if (session.pty && session.term) {
      if (size.width && size.height)
        this.resizeByWidth(session, size.width, size.height);
      else if (size.cols && size.rows)
        this.resizeByCols(session, size.cols, size.rows);
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
        // first, insert dummy nodes under parents
        const pp = p.element.parentNode;
        const pt = document.createElement('span');
        pp.insertBefore(pt, p.element);
        const pq = q.element.parentNode;
        const qt = document.createElement('span');
        pq.insertBefore(qt, q.element);
        // now move q under pp and p under pq
        pp.insertBefore(q.element, pt);
        pq.insertBefore(p.element, qt);
        // clean up
        pp.removeChild(pt);
        pq.removeChild(qt);
        // swap the elements in the session
        const temp = p.element;
        p.element = q.element;
        q.element = temp;
        // force a resize because we changed from the default font
        nextTick(() => {
          const ps = { rows: q.rows, cols: q.cols };
          const qs = { rows: p.rows, cols: p.cols };
          this.resize(sessionID, ps);
          this.resize(withID, qs);
        });
        console.log(`%cswap('${sessionID}', '${withID}')`, `color: #7b1fa2`);
      }
    }
  }

  /** Write a command to a session */
  write(sessionID: string,
        cmd: string): void {
    const session = this.get(sessionID);
    if (session.pty) {
      session.pty.write(cmd);
      console.log(`%cwrite('${sessionID}') %c${cmd}`, `color: #455a64`, `color: black`);
    }
  }

  /** Write a command to a session */
  writeln(sessionID: string,
          cmd: string): void {
    this.write(sessionID, `${cmd}\n`);
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

  // private methods

  private connect2term(session: Session,
                       prefs: LayoutPrefs,
                       element: HTMLElement): void {
    // configure a new Terminal if one doesn't exist already
    if (!session.term) {
      const options = {
        // NOTE: I think there's a bug where this object is NOT r/o!
        cols: initialCols,
        rows: initialRows,
        fontFamily: 'Roboto Mono',
        fontSize: 12,
        theme: {
          background: '#212121', // var(--mat-grey-900)
          foreground: '#f5f5f5'  // var(--mat-grey-100)
        }
      };
      session.term = new Terminal(options);
      // connect to DOM
      session.term.open(element);
      session.term.focus();
      session.term.element.style.padding = `${padding}px`;
      // NOTE: see https://github.com/xtermjs/xterm.js/#importing
      (<any>session.term).fit();
      session.element = element;
      console.log(`%cFONT %c${options.fontFamily} ${options.fontSize}px`, 'color: black', 'color: gray');
    }
    // otherwise wire up previously disconnected nodes
    else {
      const pp = element.parentNode;
      pp.insertBefore(session.element, element);
      element.remove();
    }
  }

  private connect2pty(session: Session,
                      prefs: LayoutPrefs): void {
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
      console.log(`%cENV %c${JSON.stringify(process.env)}`, 'color: black', 'color: gray');
      console.log(`%cCWD %c${cwd}`, 'color: black', 'color: gray');
    }
  }

  private resizeByCols(session: Session,
                       cols: number,
                       rows: number): void {
    session.cols = cols;
    session.rows = rows;
    session.term.resize(session.cols, session.rows);
    session.pty.resize(session.cols, session.rows);
    console.log(`%cresize('${session.id}') %c${session.cols}x${session.rows}`, `color: #004d40`, `color: black`);
  }

  private resizeByWidth(session: Session,
                        width: number,
                        height: number): void {
    if ((<any>session.term).renderer && (<any>session.term).viewport) {
      // TODO: don't really know how to make this calculation work,
      // especially for height/rows -- pty seems to have some row calculation
      // hidden factor
      const dims = (<any>session.term).renderer.dimensions;
      session.cols = Math.max(Math.round((width - (2 * padding)) / dims.actualCellWidth), 1);
      session.rows = Math.max(Math.round((height - (2 * padding)) / dims.actualCellHeight), 1) - 3;
      // finally ready to set rows, cols
      session.term.resize(session.cols, session.rows);
      session.pty.resize(session.cols, session.rows);
      // log size nicely because we refer to it all the time
      console.groupCollapsed(`%cresize('${session.id}') %c${session.cols}x${session.rows}`, `color: #0b8043`, `color: black`);
        console.table({
          width: {pixels: width, cell: dims.actualCellWidth, cells: session.cols},
          height: {pixels: height, cell: dims.actualCellHeight, cells: session.rows}
        });
      console.groupEnd();
    }
  }

}

/**
 * Model the xterm <==> node-pty session management
 */

interface Session {

  id: string;

  cols: number;
  rows: number;

  element: HTMLElement;

  pty: any;
  term: Terminal;

  pty2term(data: any): void;
  term2pty(data: any): void;

}

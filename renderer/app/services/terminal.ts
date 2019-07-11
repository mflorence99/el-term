import * as os from 'os';
import * as process from 'process';
import * as psTree from 'ps-tree';

import { ElectronService } from 'ngx-electron';
import { Injectable } from '@angular/core';
import { LayoutPrefs } from '../state/layout';
import { Terminal } from 'xterm';

import { config } from '../config';
import { nextTick } from 'ellib';

/**
 * Encapsulates xterm <==> node-pty communication
 */

@Injectable()
export class TerminalService {

  private static sessions: { [sessionID: string]: Session } = { };

  private nodePty_: { spawn: (shell: string, args: string[], opts: { }) => void };
  private os_: typeof os;
  private process_: typeof process;
  private psTree_: typeof psTree;

  /** ctor */
  constructor(private electron: ElectronService) {
    this.nodePty_ = this.electron.remote.require('node-pty');
    this.os_ = this.electron.remote.require('os');
    this.process_ = this.electron.process;
    this.psTree_ = this.electron.remote.require('ps-tree');
  }

  /** Clear a session */
  clear(sessionID: string): void {
    const session = this.get(sessionID);
    if (session.term)
      session.term.clear();
    if (session.handlers && session.handlers.title)
      session.handlers.title(null);
  }

  /** CTRL+C a session */
  ctrl_c(sessionID: string): void {
    const session = this.get(sessionID);
    if (session.pty) {
      this.psTree_(session.pty.pid, (err, children) => {
        children.forEach(child => {
          this.process_.kill(Number(child.PID), 'SIGINT');
          console.log(`%cctrl_c('${sessionID}') %c${child.COMMAND}`, `color: #d32f2f`, `color: black`);
        });
      });
    }
  }

  /** Connect to a session */
  connect(sessionID: string,
          prefs: LayoutPrefs,
          element: HTMLElement,
          dataHandler: Function,
          focusHandler: Function,
          keyHandler: Function,
          titleHandler: Function,
          scrollHandler: Function): Terminal {
    const session = this.get(sessionID);
    console.group(`%cconnect('${sessionID}')`, `color: #5d4037`);
    // configure a new Terminal if one doesn't exist already
    this.connect2term(session, prefs, element);
    this.connect2pty(session, prefs);
    // now wire them together
    if (!session.term2pty) {
      session.term2pty = data => session.pty.write(data);
      session.term.on('data', session.term2pty);
      // wire up handlers
      // NOTE: the data handler is treated specially, because we wire it
      // as an intermediary between term and pty
      session.handlers = {
        blur: () => focusHandler(false),
        data: data => dataHandler(data),
        focus: () => focusHandler(true),
        key: (_, event) => keyHandler(event),
        scroll: y => scrollHandler(y),
        title: title => titleHandler(title),
      };
      Object.keys(session.handlers)
        .filter(evt => evt !== 'data')
        .forEach(evt => {
          const handler = session.handlers[evt];
          session.term.on(evt, handler);
        });
    }
    if (!session.pty2term) {
      // NOTE: dataHandler used as filter
      session.pty2term = data => session.term.write(session.handlers.data(data));
      session.pty.addListener('data', session.pty2term);
      if (prefs.startup) {
        session.pty.write(`${prefs.startup}\n`);
        console.log(`%cStart commands %c${prefs.startup.replace(/[\n\r]/g, ', ')}`, 'color: black', 'color: gray');
      }
    }
    console.groupEnd();
    return session.term;
  }

  /** Disconnect from session */
  disconnect(sessionID: string): void {
    const session = this.get(sessionID);
    if (session.element) {
      const pp = session.element.parentNode;
      pp.removeChild(session.element);
      console.log(`%cdisconnect('${sessionID}')`, `color: #c2185b`);
    }
    if (session.pty) {
      session.pty.removeListener('data', session.pty2term);
      session.pty2term = null;
    }
    if (session.term) {
      session.term.off('data', session.term2pty);
      session.term2pty = null;
      // unwire handlers
      Object.keys(session.handlers)
        .filter(evt => evt !== 'data')
        .forEach(evt => {
          const handler = session.handlers[evt];
          session.term.off(evt, handler);
        });
    }
  }

  /** Find the next occurrence */
  findNext(sessionID: string,
           str: string): boolean {
    const session = this.get(sessionID);
    if (session.term) {
      const before = session.scrollPos;
      // NOTE: see https://github.com/xtermjs/xterm.js/#importing
      (<any>session.term).findNext(str);
      return session.scrollPos < before;
    }
    else return false;
  }

  /** Find the previous occurrence */
  findPrevious(sessionID: string,
               str: string): boolean {
    const session = this.get(sessionID);
    if (session.term) {
      const before = session.scrollPos;
      // NOTE: see https://github.com/xtermjs/xterm.js/#importing
      (<any>session.term).findPrevious(str);
      return session.scrollPos > before;
    }
    else return false;
  }

  /** Set the focus to the terminal */
  focus(sessionID: string): void {
    const session = this.get(sessionID);
    if (session.term)
      session.term.focus();
  }

  /** Grab selected text */
  getSelection(sessionID: string): string {
    const session = this.get(sessionID);
    return session.term? session.term.getSelection() : null;
  }

  /** Any selected text? */
  hasSelection(sessionID: string): boolean {
    const session = this.get(sessionID);
    return session.term? session.term.hasSelection() : false;
  }

  /** Kill a pty terminal */
  kill(sessionID: string): void {
    const session = this.get(sessionID);
    if (session.pty) {
      this.electron.ipcRenderer.send('kill', session.pty.pid);
      session.pty.destroy();
    }
    if (session.term)
      session.term.destroy();
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

  /** Record the scroll position */
  scrollPos(sessionID: string,
            y: number): void {
    const session = this.get(sessionID);
    session.scrollPos = y;
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
        // rewire the handlers -- assume both sessions have same handlers
        Object.keys(p.handlers)
          .filter(evt => evt !== 'data')
          .forEach(evt => {
            p.term.off(evt, p.handlers[evt]);
            q.term.off(evt, q.handlers[evt]);
            const handler = p.handlers[evt];
            p.handlers[evt] = q.handlers[evt];
            q.handlers[evt] = handler;
            p.term.on(evt, p.handlers[evt]);
            q.term.on(evt, q.handlers[evt]);
          });
          // NOTE: remember that the data handler is just a filter
          const handler = p.handlers.data;
          p.handlers.data = q.handlers.data;
          q.handlers.data = handler;
        // force a resize
        // NOTE: setting the OTHER session's dimensions is a shortcut,
        // as resize itself will store the new dimensions in the session
        // so we don't have to swap them first
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

  // private methods

  private connect2term(session: Session,
                       prefs: LayoutPrefs,
                       element: HTMLElement): void {
    // configure a new Terminal if one doesn't exist already
    if (!session.term) {
      const options = {
        // NOTE: I think there's a bug where this object is NOT r/o!
        cols: config.terminalWindowCols,
        rows: config.terminalWindowRows,
        scrollback: config.terminalWindowScroll,
        fontFamily: config.terminalWindowFontFamily,
        fontSize: config.terminalWindowFontSize,
        theme: {
          background: config.terminalWindowBg,
          foreground: config.terminalWindowFg
        }
      };
      session.term = new Terminal(options);
      // connect to DOM
      // @see https://www.npmjs.com/package/xterm-webfont
      (<any>session.term).loadWebfontAndOpen(element).then(() => {
        session.element = element;
        session.term.focus();
        session.term.element.style.padding = `${config.terminalWindowPadding}px`;
        // NOTE: see https://github.com/xtermjs/xterm.js/#importing
        (<any>session.term).fit();
        (<any>session.term).webLinksInit();
        // force a resize because we changed from the default font
        this.resizeByWidth(session, element.parentElement.clientWidth, element.parentElement.clientHeight);
        // TODO: temporary
        session.pty.write('echo Ready\n');
        console.log(`%cFONT %c${options.fontFamily} ${options.fontSize}px`, 'color: black', 'color: gray');
      });
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
      // replace ~ for $HOME with actual home directory
      let cwd = this.process_.cwd();
      if (prefs.directory) {
        const home = this.process_.env['HOME'];
        cwd = prefs.directory
          .replace(/^~/, home)
          .replace(/^\$HOME/, home);
      }
      // launch node-pty over real terminal
      const shell = this.process_.env[this.os_.platform() === 'win32'? 'COMSPEC' : 'SHELL'];
      session.pty = this.nodePty_.spawn(shell, [], {
        cols: config.terminalWindowCols,
        cwd: cwd,
        env: this.process_.env,
        name: 'xterm-256color',
        rows: config.terminalWindowRows
      });
      this.electron.ipcRenderer.send('connect', session.pty.pid);
      console.log(`%cENV %c${JSON.stringify(this.process_.env)}`, 'color: black', 'color: gray');
      console.log(`%cCWD %c${cwd}`, 'color: black', 'color: gray');
    }
  }

  /** Delete a session */
  private delete(sessionID: string): void {
    delete TerminalService.sessions[sessionID];
  }

  /** Get a session */
  private get(sessionID: string): Session {
    let session = TerminalService.sessions[sessionID];
    if (!session) {
      session = { id: sessionID } as Session;
      TerminalService.sessions[sessionID] = session;
    }
    return session;
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
      const dims = (<any>session.term).renderer.dimensions;
      const padding = config.terminalWindowPadding;
      session.cols = Math.max(Math.round((width - (2 * padding)) / dims.actualCellWidth), 1);
      session.rows = Math.max(Math.round((height - (2 * padding)) / dims.actualCellHeight), 1);
      // finally ready to set rows, cols
      session.term.resize(session.cols, session.rows);
      session.pty.resize(session.cols, session.rows);
      // log size nicely because we refer to it all the time
      console.group(`%cresize('${session.id}') %c${session.cols}x${session.rows}`, `color: #0b8043`, `color: black`);
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
  cols: number;
  element: HTMLElement;
  handlers: { [s: string]: any; };
  id: string;
  pty: any;
  rows: number;
  scrollPos: number;
  term: Terminal;

  pty2term(data: any): void;
  term2pty(data: any): void;
}

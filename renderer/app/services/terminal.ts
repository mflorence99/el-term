import { ElectronService } from 'ngx-electron';
import { Injectable } from '@angular/core';
import { Terminal } from 'xterm';

const initialCols = 80;
const initialRows = 24;
const padding = 16;

declare var ELTerm_nodePtyFactory: Function;

/**
 * Encapsulates xterm <==> node-pty communication
 */

@Injectable()
export class TerminalService {

  private static ptys: { [sessionID: string]: any } = { };
  private static terms: { [sessionID: string]: Terminal } = { };

  /** ctor */
  constructor(private electron: ElectronService) {
    this.electron.ipcRenderer.on('kill', () => {
      const ptys = TerminalService.ptys;
      Object.keys(ptys).forEach(sessionID => ptys[sessionID].kill());
    });
  }

  /** Connect to a session */
  connect(sessionID: string,
          element: HTMLElement): Terminal {
    const terms = TerminalService.terms;
    let term = terms[sessionID];
    if (!term) {
      term = new Terminal({
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
      term.open(element);
      term.element.style.padding = `${padding}px`;
      (<any>term).fit();
      terms[sessionID] = term;
    }
    // connect to pty terminal
    const ptys = TerminalService.ptys;
    let pty = ptys[sessionID];
    if (!pty) {
      pty = ELTerm_nodePtyFactory(initialCols, initialRows);
      ptys[sessionID] = pty;
    }
    // wire them together
    term.on('data', data => pty.write(data));
    pty.on('data', data => term.write(data));
    return term;
  }

  /** Disconnect from session */
  disconnect(sessionID: string): void {
    const terms = TerminalService.terms;
    if (terms[sessionID]) {
      terms[sessionID].destroy();
      delete terms[sessionID];
    }
  }

  /** Kill a pty terminal */
  kill(sessionID: string): void {
    this.disconnect(sessionID);
    const ptys = TerminalService.ptys;
    if (ptys[sessionID]) {
      ptys[sessionID].kill();
      delete ptys[sessionID];
    }
  }

  /** Resize session window */
  resize(sessionID: string,
         width: number,
         height: number): void {
    const term: any = TerminalService.terms[sessionID];
    if (term && term.renderer && term.viewport) {
      // TODO: don't really know how to make this calculation work,
      // especially for height/rows -- pty seems to have some row calculation
      // hidden factor
      // NOTE: we suppress the scrollbar visually in theme.scss
      const cols = Math.max(Math.trunc((width - (2 * padding)) / term.renderer.dimensions.actualCellWidth), 1);
      const rows = Math.max(Math.trunc((height - (2 * padding))  / term.renderer.dimensions.actualCellHeight), 1) - 3;
      const pty = TerminalService.ptys[sessionID];
      if (pty) {
        term.resize(cols, rows);
        pty.resize(cols, rows);
      }
    }
  }

}

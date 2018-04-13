const os = require('os');
const pty = require('node-pty');

/**
 * A factory for none-pty processes
 *
 * NOTE: this is used by the renderer, but the Angular CLI can't digest it.
 */

function ELTerm_nodePtyFactory(cols, rows) {
  const shell = process.env[os.platform() === 'win32'? 'COMSPEC' : 'SHELL'];
  return pty.spawn(shell, [], {
    cols: cols,
    cwd: process.cwd(),
    env: process.env,
    name: 'xterm-256color',
    rows: rows
  });
}

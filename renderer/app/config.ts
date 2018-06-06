/**
 * el-term config
 */

export class Config {

  resizePaneThrottle = 250;
  setBoundsThrottle = 250;

  terminalWindowBg = '#212121'; // var(--mat-grey-900)
  terminalWindowCols = 80;
  terminalWindowFg = '#f5f5f5';  // var(--mat-grey-100)
  terminalWindowFontFamily = 'Roboto Mono';
  terminalWindowFontSize = 12;
  terminalWindowPadding = 16;
  terminalWindowRows = 24;
  terminalWindowScroll = 10000;

}

export const config = new Config();

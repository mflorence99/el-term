import { BarrelModule } from './barrel';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { ContextMenuModule } from 'ngx-contextmenu';
import { NgModule } from '@angular/core';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { RootPageComponent } from './pages/root/page';
import { RootPageModule } from './pages/root/module';
import { StorageOption } from '@ngxs/storage-plugin';
import { TerminalService } from './services/terminal';

import { states } from './state/app';

/**
 * el-term module definition
 */

const COMPONENTS = [ ];

const MODULES = [
  BarrelModule,
  BrowserAnimationsModule,
  BrowserModule,
  RootPageModule
];

const SERVICES = [
  TerminalService
];

@NgModule({

  bootstrap: [RootPageComponent],

  declarations: [
    ...COMPONENTS
  ],

  imports: [
    ...MODULES,
    ContextMenuModule.forRoot({
      autoFocus: true
    }),
    NgxsModule.forRoot(states),
    NgxsLoggerPluginModule.forRoot({
      collapsed: false,
      logger: console
    }),
    NgxsStoragePluginModule.forRoot({
      key: ['layout', 'tabs', 'window'],
      storage: StorageOption.LocalStorage
    }),
    NgxsReduxDevtoolsPluginModule.forRoot({disabled: !window['DEV_MODE']})
  ],

  providers: [
    ...SERVICES
  ]

})

export class ELTermModule { }

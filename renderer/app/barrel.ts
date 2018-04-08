import { AngularSplitModule } from 'angular-split';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ContextMenuModule } from 'ngx-contextmenu';
import { LibModule } from 'ellib/lib/module';
import { NgModule } from '@angular/core';
import { NgxElectronModule } from 'ngx-electron';
/**
 * A barrel of all the modules we use everywhere
 */

const MODULES = [
  AngularSplitModule,
  BrowserModule,
  BrowserAnimationsModule,
  CommonModule,
  ContextMenuModule,
  LibModule,
  NgxElectronModule
];

@NgModule({

  imports: [
    ...MODULES
  ],

  exports: [
    ...MODULES
  ],

})

export class BarrelModule { }

import { BarrelModule } from '../../barrel';
import { MenuComponent } from './menu';
import { NgModule } from '@angular/core';
import { RootCtrlComponent } from './ctrl';
import { RootPageComponent } from './page';

/**
 * Root page module
 */

const COMPONENTS = [
  MenuComponent,
  RootCtrlComponent,
  RootPageComponent
];

const MODULES = [
  BarrelModule
];

@NgModule({

  declarations: [
    ...COMPONENTS
  ],

  exports: [
    RootPageComponent
  ],

  imports: [
    ...MODULES
  ]

})

export class RootPageModule { }

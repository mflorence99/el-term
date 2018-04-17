import { BarrelModule } from '../barrel';
import { NgModule } from '@angular/core';
import { PaneComponent } from './pane';
import { PrefsComponent } from './prefs';
import { SearchComponent } from './search';
import { SplittableComponent } from './splittable';
import { TabComponent } from './tab';
import { TabsComponent } from './tabs';
import { TerminalComponent } from './terminal';

/**
 * All our components
 */

const COMPONENTS = [
  PaneComponent,
  PrefsComponent,
  SearchComponent,
  SplittableComponent,
  TabComponent,
  TabsComponent,
  TerminalComponent
];

@NgModule({

  declarations: [
    ...COMPONENTS
  ],

  exports: [
    ...COMPONENTS
  ],

  imports: [
    BarrelModule
  ]

})

export class ComponentsModule { }

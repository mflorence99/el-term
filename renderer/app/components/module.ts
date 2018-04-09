import { BarrelModule } from '../barrel';
import { NgModule } from '@angular/core';
import { PaneComponent } from './pane';
import { SplittableComponent } from './splittable';
import { TabComponent } from './tab';
import { TabsComponent } from './tabs';

/**
 * All our components
 */

const COMPONENTS = [
  PaneComponent,
  SplittableComponent,
  TabComponent,
  TabsComponent
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

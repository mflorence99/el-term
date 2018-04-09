import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LayoutState, LayoutStateModel } from '../../state/layout';
import { Tab, TabsState, TabsStateModel } from '../../state/tabs';

import { Observable } from 'rxjs/Observable';
import { Select } from '@ngxs/store';
import { map } from 'rxjs/operators';

/**
 * Root controller
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'elterm-root-ctrl',
  styles: [':host { display: none; }'],
  template: ''
})

export class RootCtrlComponent {

  @Select(LayoutState) layout$: Observable<LayoutStateModel>;
  @Select(TabsState) tabs$: Observable<TabsStateModel>;

  tab$: Observable<Tab> = this.tabs$.pipe(
    map((tabs: TabsStateModel) => tabs.tabs.find(tab => tab.selected))
  );

  tabIndex$: Observable<number> = this.tabs$.pipe(
    map((tabs: TabsStateModel) => tabs.tabs.findIndex(tab => tab.selected))
  );

}

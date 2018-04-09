import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Layout, LayoutState, LayoutStateModel } from '../../state/layout';
import { Tab, TabsState, TabsStateModel } from '../../state/tabs';
import { map, switchMap, tap } from 'rxjs/operators';

import { Observable } from 'rxjs/Observable';
import { Select } from '@ngxs/store';

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

  @Select(LayoutState) layouts$: Observable<LayoutStateModel>;
  @Select(TabsState) tabs$: Observable<TabsStateModel>;

  tab$: Observable<Tab> = this.tabs$.pipe(
    map((tabs: TabsStateModel) => tabs.tabs.find(tab => tab.selected))
  );

  tabIndex$: Observable<number> = this.tabs$.pipe(
    map((tabs: TabsStateModel) => tabs.tabs.findIndex(tab => tab.selected))
  );

  layout$: Observable<Layout> = this.tab$.pipe(
    switchMap((tab: Tab) => {
      return this.layouts$.pipe(
        map((model: LayoutStateModel) => model[tab.id]),
        tap((layout: Layout) => console.log('XXX', tab, layout))
      );
    })
  );

}

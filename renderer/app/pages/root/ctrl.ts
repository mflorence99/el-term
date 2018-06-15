import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { Layout } from '../../state/layout';
import { LayoutState } from '../../state/layout';
import { LayoutStateModel } from '../../state/layout';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { switchMap } from 'rxjs/operators';
import { Tab } from '../../state/tabs';
import { TabsState } from '../../state/tabs';
import { TabsStateModel } from '../../state/tabs';
import { take } from 'rxjs/operators';
import { WindowState } from '../../state/window';
import { WindowStateModel } from '../../state/window';

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
  @Select(WindowState) window$: Observable<WindowStateModel>;

  tab$: Observable<Tab> = this.tabs$.pipe(
    map((tabs: TabsStateModel) => {
      const tab = tabs.tabs.find(tab => tab.selected);
      return tab? { ...tab } : null;
    })
  );

  tabIndex$: Observable<number> = this.tabs$.pipe(
    map((tabs: TabsStateModel) => tabs.tabs.findIndex(tab => tab.selected))
  );

  layout$: Observable<Layout> = this.tab$.pipe(
    switchMap((tab: Tab) => {
      return this.layouts$.pipe(
        map((model: LayoutStateModel) => tab? { ...model[tab.id] } : null)
      );
    })
  );

  /** ctor */
  constructor(private electron: ElectronService) {
    this.window$.pipe(take(1))
      .subscribe((window: WindowStateModel) => {
        const win = this.electron.remote.getCurrentWindow();
        if (window.bounds)
          win.setBounds(window.bounds);
      });
  }

}

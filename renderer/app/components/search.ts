import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DrawerPanelComponent, LifecycleComponent, OnChange, nextTick } from 'ellib';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LayoutSearch, SetSearch, SetSearchWrap } from '../state/layout';

import { Store } from '@ngxs/store';
import { TerminalService } from '../services/terminal';
import { config } from '../config';

/**
 * Search component
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'elterm-search',
  templateUrl: 'search.html',
  styleUrls: ['search.scss']
})

export class SearchComponent extends LifecycleComponent {

  @Input() search = { } as LayoutSearch;
  @Input() searchID: string;

  searchForm: FormGroup;

  /** ctor */
  constructor(private drawerPanel: DrawerPanelComponent,
              private formBuilder: FormBuilder,
              private store: Store,
              private termSvc: TerminalService) {
    super();
    this.searchForm = this.formBuilder.group({
      str: ['', Validators.required]
    });
  }

  // event handlers

  onClear(nm: string) {
    this.searchForm.patchValue({ [nm]: '' }, {emitEvent: false});
  }

  onSave() {
    this.store.dispatch(new SetSearch({ splitID: this.searchID,
                                        search: this.searchForm.value }));
    this.drawerPanel.close();
    this.termSvc.focus(this.searchID);
  }

  onSubmit(dir: 'next' | 'prev') {
    // TODO: why do we need this in Electron? and only running live?
    // at worst, running in NgZone should work -- but otherwise a DOM
    // event is necessary to force change detection
    nextTick(() => {
      this.store.dispatch(new SetSearch({ splitID: this.searchID,
                                          search: this.searchForm.value }));
      let wrap: boolean;
      switch (dir) {
        case 'next':
          wrap = this.termSvc.findNext(this.searchID, this.searchForm.value.str);
          break;
        case 'prev':
          wrap = this.termSvc.findPrevious(this.searchID, this.searchForm.value.str);
          break;
      }
      // highlight if we wrap
      if (wrap) {
        this.store.dispatch(new SetSearchWrap({ splitID: this.searchID, wrap: true }));
        setTimeout(() => {
          this.store.dispatch(new SetSearchWrap({ splitID: this.searchID, wrap: false }));
        }, config.searchWrapHiliteDelay);
      }
    });
  }

  // bind OnChange handlers

  @OnChange('search') patchTab() {
    if (this.search)
      this.searchForm.patchValue(this.search, {emitEvent: false});
  }

}

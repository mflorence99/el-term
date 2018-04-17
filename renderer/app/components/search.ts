import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LayoutSearch, SetSearch } from '../state/layout';

import { DrawerPanelComponent } from 'ellib';
import { LifecycleComponent } from 'ellib';
import { OnChange } from 'ellib';
import { Store } from '@ngxs/store';
import { TerminalService } from '../services/terminal';

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

  onCancel() {
    this.drawerPanel.close();
  }

  onClear(nm: string) {
    this.searchForm.patchValue({ [nm]: '' }, {emitEvent: false});
  }

  onSubmit(dir: 'next' | 'prev') {
    this.store.dispatch(new SetSearch({ id: this.searchID, search: this.searchForm.value }));
    switch (dir) {
      case 'next':
        this.termSvc.findNext(this.searchID, this.searchForm.value.str);
        break;
      case 'prev':
        this.termSvc.findPrevious(this.searchID, this.searchForm.value.str);
        break;
    }
  }

  // bind OnChange handlers

  @OnChange('search') patchTab() {
    if (this.search)
      this.searchForm.patchValue(this.search, {emitEvent: false});
  }

}

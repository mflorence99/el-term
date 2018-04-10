import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RemoveTab, SelectPermanentTab, Tab, UpdateTab } from '../state/tabs';

import { DrawerPanelComponent } from 'ellib/lib/components/drawer-panel';
import { LifecycleComponent } from 'ellib/lib/components/lifecycle';
import { OnChange } from 'ellib/lib/decorators/onchange';
import { Store } from '@ngxs/store';
import { nextTick } from 'ellib/lib/utils';

/**
 * Tab component
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'elterm-tab',
  templateUrl: 'tab.html',
  styleUrls: ['tab.scss']
})

export class TabComponent extends LifecycleComponent {

  @Input() tab = { } as Tab;

  areYouSure: boolean;
  tabForm: FormGroup;

  /** ctor */
  constructor(private drawerPanel: DrawerPanelComponent,
              private formBuilder: FormBuilder,
              private store: Store) {
    super();
    this.tabForm = this.formBuilder.group({
      label: ['', Validators.required],
      icon: ['', Validators.required],
      color: ['', Validators.required]
    });
  }

  // event handlers

  onCancel() {
    this.areYouSure = false;
    this.drawerPanel.close();
  }

  onRemove(areYouSure: boolean) {
    if (areYouSure) {
      // NOTE: we need to make sure a tab is selected after we delete
      // one that itself may have been selected -- we also delay removal
      // so this component can clean up first
      this.store.dispatch(new SelectPermanentTab());
      nextTick(() => this.store.dispatch(new RemoveTab(this.tab)));
      this.onCancel();
    }
    else this.areYouSure = true;
  }

  onSubmit() {
    this.store.dispatch(new UpdateTab({ id: this.tab.id, ...this.tabForm.value}));
    this.onCancel();
  }

  // bind OnChange handlers

  @OnChange('tab') patchTab() {
    this.areYouSure = false;
    if (this.tab)
      this.tabForm.patchValue(this.tab, {emitEvent: false});
  }

}

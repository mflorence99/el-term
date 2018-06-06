import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DrawerPanelComponent, LifecycleComponent, OnChange } from 'ellib';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Tab, UpdateTab } from '../state/tabs';

import { Store } from '@ngxs/store';

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
    this.drawerPanel.close();
  }

  onClear(nm: string) {
    this.tabForm.patchValue({ [nm]: '' }, { emitEvent: false });
  }

  onSubmit() {
    const tab = { id: this.tab.id, ...this.tabForm.value };
    this.store.dispatch(new UpdateTab({ tab }));
    this.onCancel();
  }

  // bind OnChange handlers

  @OnChange('tab') patchTab() {
    if (this.tab)
      this.tabForm.patchValue(this.tab, {emitEvent: false});
  }

}

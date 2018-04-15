import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { LayoutPrefs, SetPrefs } from '../state/layout';

import { DrawerPanelComponent } from 'ellib';
import { LifecycleComponent } from 'ellib';
import { OnChange } from 'ellib';
import { Store } from '@ngxs/store';

/**
 * Prefs component
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'elterm-prefs',
  templateUrl: 'prefs.html',
  styleUrls: ['prefs.scss']
})

export class PrefsComponent extends LifecycleComponent {

  @Input() prefs = { } as LayoutPrefs;
  @Input() prefsID: string;

  prefsForm: FormGroup;

  /** ctor */
  constructor(private drawerPanel: DrawerPanelComponent,
              private formBuilder: FormBuilder,
              private store: Store) {
    super();
    this.prefsForm = this.formBuilder.group({
      badge: '',
      directory: '',
      startup: ''
    });
  }

  // event handlers

  onCancel() {
    this.drawerPanel.close();
  }

  onClear(nm: string) {
    this.prefsForm.patchValue({ [nm]: '' }, {emitEvent: false});
  }

  onSubmit() {
    this.store.dispatch(new SetPrefs({ id: this.prefsID, prefs: this.prefsForm.value }));
    this.onCancel();
  }

  // bind OnChange handlers

  @OnChange('prefs') patchTab() {
    if (this.prefs)
      this.prefsForm.patchValue(this.prefs, {emitEvent: false});
  }

}

import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { DrawerPanelComponent } from 'ellib';
import { FormBuilder } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Input } from '@angular/core';
import { LayoutPrefs } from '../state/layout';
import { LifecycleComponent } from 'ellib';
import { nextTick } from 'ellib';
import { OnChange } from 'ellib';
import { SetPrefs } from '../state/layout';
import { Store } from '@ngxs/store';
import { TerminalService } from '../services/terminal';

/**
 * Prefs component
 */

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
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
              private store: Store,
              private termSvc: TerminalService) {
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
    this.termSvc.focus(this.prefsID);
  }

  onClear(nm: string) {
    this.prefsForm.patchValue({ [nm]: '' }, {emitEvent: false});
  }

  onSubmit() {
    // TODO: why do we need this in Electron? and only running live?
    // at worst, running in NgZone should work -- but otherwise a DOM
    // event is necessary to force change detection
    nextTick(() => {
      this.store.dispatch(new SetPrefs({ splitID: this.prefsID,
                                         prefs: this.prefsForm.value }));
    });
    this.onCancel();
  }

  // bind OnChange handlers

  @OnChange('prefs') patchTab() {
    if (this.prefs)
      this.prefsForm.patchValue(this.prefs, {emitEvent: false});
  }

}

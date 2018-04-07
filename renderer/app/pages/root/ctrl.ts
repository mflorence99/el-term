import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MenuState, MenuStateModel } from '../../state/menu';

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

  @Select(MenuState) menu$: Observable<MenuStateModel>;

}

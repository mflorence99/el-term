import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';

import { ContextMenuComponent } from 'ngx-contextmenu';
import { MenuStateModel } from '../../state/menu';

/**
 * Menu component
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'elterm-menu',
  templateUrl: 'prefs.html',
  styleUrls: ['prefs.scss']
})

export class MenuComponent {

  @Input() menu = {} as MenuStateModel;

  @ViewChild(ContextMenuComponent) theMenu: ContextMenuComponent;

  xxx(event) {
    console.log(event);
  }

}

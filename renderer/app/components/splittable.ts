import { AfterViewInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContextMenuComponent } from 'ngx-contextmenu';
import { Input } from '@angular/core';
import { Layout } from '../state/layout';
import { SplitComponent } from 'angular-split';
import { Store } from '@ngxs/store';
import { Tab } from '../state/tabs';
import { UpdateSplitSizes } from '../state/layout';
import { ViewChild } from '@angular/core';

import { debounce } from 'ellib';

/**
 * Splittable component
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'elterm-splittable',
  templateUrl: 'splittable.html',
  styleUrls: ['splittable.scss']
})

export class SplittableComponent implements AfterViewInit {

  @Input() layout = { } as Layout;
  @Input() menu: ContextMenuComponent;
  @Input() swapWith: string;
  @Input() tab = { } as Tab;

  @ViewChild(SplitComponent, { static: true }) split: SplitComponent;

  private updateSplitSizes: Function;

  /** ctor */
  constructor(private store: Store) {
    this.updateSplitSizes = debounce(this._updateSplitSizes, 500);
  }

  // event handlers

  onSplitSizeChange(event: {gutterNum: number,
                            sizes: number[]}): void {
    this.updateSplitSizes(this.layout.id, event.sizes);
  }

  // lifecycle methods

  ngAfterViewInit(): void {
    this.split.dragProgress$.subscribe((event: any) => this.onSplitSizeChange(event));
  }

  // private methods

  private _updateSplitSizes(splitID: string,
                            sizes: number[]): void {
    this.store.dispatch(new UpdateSplitSizes({splitID, sizes}));
  }

}

import * as fit from 'xterm/lib/addons/fit/fit';

import { ELTermModule } from './app/module';
import { Terminal } from 'xterm';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

Terminal.applyAddon(fit);

platformBrowserDynamic().bootstrapModule(ELTermModule)
  .catch(err => console.log(err));

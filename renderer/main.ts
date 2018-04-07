import { ELTermModule } from './app/module';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

platformBrowserDynamic().bootstrapModule(ELTermModule)
  .catch(err => console.log(err));

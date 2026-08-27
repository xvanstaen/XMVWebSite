import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './src/app/app.config';
import { AppComponent } from './src/app/app.component';
import { Buffer } from 'buffer';

(window as any).Buffer = Buffer;
(window as any).global = window;
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
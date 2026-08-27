import { bootstrapApplication } from '@angular/platform-browser';
import { enableProdMode } from '@angular/core';
import { appConfig } from './src/app/app.config';
import { AppComponent } from './src/app/app.component';
import { Buffer } from 'buffer';
import { environment } from './src/environments/environment';

if (environment.production) {
  enableProdMode();
}
(window as any).Buffer = Buffer;
(window as any).global = window;
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
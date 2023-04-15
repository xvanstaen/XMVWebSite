import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatIconModule} from '@angular/material/icon';
import { CommonModule,  DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule} from '@angular/material/dialog';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { XmvCompanyComponent } from './xmv-company/xmv-company.component';
import { XMVCompanyContactComponent } from './xmv-company/xmvcompany-contact/xmvcompany-contact.component';
import { XMVCompanyOfferComponent } from './xmv-company/xmvcompany-offer/xmvcompany-offer.component';
import { XMVCompanyProfileComponent } from './xmv-company/xmvcompany-profile/xmvcompany-profile.component';
import { RespondContactComponent } from './Special-Services/Respond-Contact.component';
import { LoginComponent } from './Login/login.component';
import { Event27AugComponent}  from './Special-Services/Event-27AUG2022.component';
import { Event02JULComponent}  from './Special-Services/Event-02JUL2022.component';
import { WeddingPhotosComponent}  from './Special-Services/WeddingPhotos.component';
import { GetImagesComponent}  from './Special-Services/GetImages.component';
import { AdminJsonComponent}  from './Special-Services/AdminJson.component';
import { AdminLoginComponent}  from './Special-Services/AdminLogin.component';
import { AdminConsoleComponent}  from './Special-Services/AdminConsole.component';
import { ListBucketContentComponent}  from './Special-Services/ListBucketContent.component';
import { ChangeSaveFileNameComponent}  from './Special-Services/ChangeSaveFileName.component';
import { OneCalendarComponent } from './one-calendar/one-calendar.component';
import { FitnessStatComponent } from './fitness-stat/fitness-stat.component';
import {ManageGoogleService} from 'src/app/CloudServices/ManageGoogle.service';
import {ManageMangoDBService} from 'src/app/CloudServices/ManageMangoDB.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';
import { FitnessChartComponent } from './fitness-chart/fitness-chart.component';
import { MyDropDownComponent } from './my-drop-down/my-drop-down.component';
import { HealthComponent } from './health/health.component';

@NgModule({
  declarations: [
    AppComponent,
    XmvCompanyComponent,
    XMVCompanyContactComponent,
    XMVCompanyOfferComponent,
    XMVCompanyProfileComponent,
    RespondContactComponent,
    LoginComponent,
    Event27AugComponent,
    Event02JULComponent,
    WeddingPhotosComponent,
    GetImagesComponent,
    AdminJsonComponent,
    AdminLoginComponent,
    AdminConsoleComponent,
    ListBucketContentComponent,
    ChangeSaveFileNameComponent,
    FitnessStatComponent,
    OneCalendarComponent,
    FitnessChartComponent,
    MyDropDownComponent,
    HealthComponent,


  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    CommonModule,
    FormsModule,
    MatIconModule,
    MatDialogModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    DatePipe, AccessConfigService, ManageGoogleService, ManageMangoDBService,  
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

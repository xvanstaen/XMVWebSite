import { Component, OnInit , Input, Output, HostListener,  HostBinding, ChangeDetectionStrategy, 
  SimpleChanges,EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID} from '@angular/core';
  
import { DatePipe, formatDate } from '@angular/common'; 

import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router} from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';
import { Observable } from 'rxjs';

import { BucketList } from '../JsonServerClass';
import { Bucket_List_Info } from '../JsonServerClass';

// configServer is needed to use ManageGoogleService
// it is stored in MangoDB and accessed via ManageMangoDBService
import { configServer } from '../JsonServerClass';
import { XMVConfig } from '../JsonServerClass';
import { environment } from 'src/environments/environment';
import { LoginIdentif } from '../JsonServerClass';
import {manage_input} from '../manageinput';
import {eventoutput, thedateformat} from '../apt_code_name';
import { msgConsole } from '../JsonServerClass';
import {msginLogConsole} from '../consoleLog'

import { mainClassCaloriesFat, mainDailyReport} from '../ClassHealthCalories'
import {mainConvItem, mainRecordConvert, mainClassUnit, mainClassConv} from '../ClassConverter'

import { ManageMangoDBService } from 'src/app/CloudServices/ManageMangoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import {AccessConfigService} from 'src/app/CloudServices/access-config.service';



@Component({
  selector: 'app-report-health',
  templateUrl: './report-health.component.html',
  styleUrls: ['./report-health.component.css']
})

export class ReportHealthComponent implements OnInit {

  
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMangoDBService: ManageMangoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
    ) { }


  @Input() XMVConfig=new XMVConfig;
  @Input() configServer = new configServer;
  @Input() identification= new LoginIdentif;

  @Input() HealthAllData=new mainDailyReport;
  @Input() ConfigCaloriesFat=new mainClassCaloriesFat;
  @Input() ConvertUnit= new mainClassConv;
  @Input() ConvToDisplay=new mainConvItem;
  @Input() theTabOfUnits=new mainClassUnit;
  @Input() WeightRefTable=new mainRecordConvert;

  @Output() returnFile= new EventEmitter<any>();



  ngOnInit() {
    var i=0;
    /*
        for day and meal calculate the calories & fat
        consolidate monthly

        date; meal; calories; cholesterol; saturated

        convert everything in grams

        








    */

  }

}




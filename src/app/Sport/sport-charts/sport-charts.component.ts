import {
  Component, OnInit, Input, Output, ViewChild, HostListener, HostBinding, ChangeDetectionStrategy,
  SimpleChanges, EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID
} from '@angular/core';

import { DatePipe, formatDate, ViewportScroller } from '@angular/common';

//import  { Color, Label } from 'ng2-charts';
import {
  Chart, ChartOptions, ChartType, ChartConfiguration, PluginChartOptions, ScaleChartOptions, ChartDataset,
  BarController, BarElement, CategoryScale, ChartData, LinearScale, LineController, LineElement, PointElement,
} from 'chart.js/auto';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormGroup, FormControl, UntypedFormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { Observable } from 'rxjs';

import { classConfigChart, classchartHealth } from './../../Health/classConfigChart';
import { classAxis, classLegendChart, classPluginTitle, classTabFormChart, classFileParamChart, classReturnColor } from './../../Health/classChart';

import { configServer, LoginIdentif, msgConsole, classtheEvent } from '../../JsonServerClass';
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { AccessConfigService } from 'src/app/CloudServices/access-config.service';

import { classFileSystem, classAccessFile, classReturnDataFS } from '../../classFileSystem';

@Component({
  selector: 'app-sport-charts',
  templateUrl: './sport-charts.component.html',
  styleUrls: ['./sport-charts.component.css']
})

export class SportChartsComponent implements OnInit {

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
  ) {}

  @Input() identification = new LoginIdentif;

  @Input() configChart = new classchartHealth;
  @Input() inFileParamChart = new classFileParamChart;
  @Input() configServer = new configServer;

  @Input() tabLock = new classAccessFile; //.lock ++> 0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked;
  @Input() actionParamChart:number = 0;
  @Input() returnDataFS = new classReturnDataFS;

  theActions ={manageParam:false, displayCanvas:false};

  @Output() checkLockLimit = new EventEmitter<any>();
  @Output() processSave = new EventEmitter<any>();
  @Output() retrieveRecord = new EventEmitter<any>();
  @Output() unlockFile = new EventEmitter<any>();

  ngOnInit(): void {
    
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const j = changes[propName];
      if (propName === 'typeChartToDisplay' && changes[propName].firstChange === true) {

      }
    }
  }

}
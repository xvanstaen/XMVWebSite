import {
  Component, OnInit, Input, Output, ViewChild, HostListener, HostBinding, ChangeDetectionStrategy,
  SimpleChanges, EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID
} from '@angular/core';

import { CommonModule,  DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { classConfigChart, classchartHealth } from './../../Health/classConfigChart';
import { classAxis, classLegendChart, classPluginTitle, classTabFormChart, classFileParamChart, classReturnColor } from './../../Health/classChart';

import { configServer, LoginIdentif, msgConsole, classtheEvent } from '../../JsonServerClass';

import { classFileSystem, classAccessFile, classReturnDataFS } from '../../classFileSystem';

@Component({
  selector: 'app-sport-charts',
  templateUrl: './sport-charts.component.html',
  styleUrls: ['./sport-charts.component.css'],
  standalone:true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule,],

})

export class SportChartsComponent implements OnInit {

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
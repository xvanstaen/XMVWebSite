import { Component, OnInit, ViewChild, AfterViewInit,SimpleChanges,
  Output, Input, HostListener, EventEmitter, ElementRef, } from '@angular/core';

import { CommonModule,  DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup,UntypedFormControl, FormControl, Validators, FormBuilder, FormArray} from '@angular/forms';

import { RoutingAppComponent } from '../routing-app/routing-app.component';
import { SelectServerComponent } from '../select-server/select-server.component';
import { XmvCompanyComponent } from '../xmv-company/xmv-company.component';

import { FitnessStatComponent } from '../Health/fitness-stat/fitness-stat.component';
import { MainHealthComponent } from '../Health/main-health/main-health.component';
import { ConverterComponent } from '../converter/converter.component';
import { RecipeComponent } from '../recipe/recipe.component';
import { TestServerJSComponent } from '../test-server-js/test-server-js.component';

import { ManagePointOfRefComponent } from '../Sport/manage-point-of-ref/manage-point-of-ref.component';
import { ManageCircuitsComponent } from '../Sport/manage-circuits/manage-circuits.component';
import { SportReportsComponent } from '../Sport/sport-reports/sport-reports.component';
import { SportAnalysisComponent } from '../Sport/sport-analysis/sport-analysis.component';
import { SportPerfRawDataMgtComponent } from '../Sport/sport-perf-raw-data-mgt/sport-perf-raw-data-mgt.component';
import { SportPerformanceComponent } from '../Sport/sport-performance/sport-performance.component';
import { KioskAbdConfigComponent } from '../kiosk-abd-config/kiosk-abd-config.component';
import { RunningClockComponent } from '../Health/running-clock/running-clock.component';
import { MyCanvasComponent } from '../my-canvas/my-canvas.component';
import { Event27AugComponent}  from '../Special-Services/Event-27AUG2022.component';
import { GetImagesComponent}  from '../Special-Services/GetImages.component';

import { LoginIdentif , configServer, classUserLogin } from '../JsonServerClass';
import { EventAug, configPhoto, StructurePhotos } from '../JsonServerClass';
import { environment } from '../../environments/environment';
import { classCredentials} from '../JsonServerClass';
import { mainClassConv,mainConvItem, mainRecordConvert, mainClassUnit} from '../ClassConverter';
import { classAccessFile } from '../classFileSystem';
import { drawNumbers, drawHourHand, drawMinuteHand, drawSecondHand, classPosSizeClock} from '../clockFunctions'

export class classTabApps{
  apps:string="";
  select:number=0;
  display:boolean=false;
}

@Component({
  selector: 'app-user-functions',
  templateUrl: './user-functions.component.html',
  styleUrls: ['./user-functions.component.css'],
  standalone: true, 
  imports:[CommonModule, FormsModule, ReactiveFormsModule, RoutingAppComponent, SelectServerComponent, MainHealthComponent, 
    ConverterComponent, RecipeComponent, TestServerJSComponent, ManageCircuitsComponent, ManagePointOfRefComponent, SportPerformanceComponent,
    SportReportsComponent, SportAnalysisComponent, SportPerfRawDataMgtComponent, FitnessStatComponent, 
    KioskAbdConfigComponent, RunningClockComponent, MyCanvasComponent, Event27AugComponent, GetImagesComponent
  ],

})

export class UserFunctionsComponent {

    @Input() identification = new LoginIdentif;
    @Input() configServer = new configServer;
    @Input() credentials = new classCredentials;
    @Input() credentialsMongo = new classCredentials;
    @Input() credentialsFS = new classCredentials;
    @Input() configServerChanges:number=0;

    @Input() LoginTable_User_Data:Array<EventAug>=[];
    @Input() LoginTable_DecryptPSW:Array<string>=[];
  
    @Input() ConvToDisplay=new mainConvItem;

    @Input() devMode:string="";

    @Output() serverChange=  new EventEmitter<any>();
    @Output() callUserFunction= new EventEmitter<any>();

    posSizeClock=new classPosSizeClock;

    tabLock: Array<classAccessFile> = []; //0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked;
    maxEventHTTPrequest: number = 12;

    convertOnly:boolean=true;

    selectApps:number=0;
    dictionaryOnly:boolean=false;
    selHealthFunction:number=0;

    inputSelect:number=0;
    isAppsSelected:boolean=false;

    isResetServer:boolean=false;
    isIdRetrieved:boolean=true;
    isConfigServerRetrieved:boolean=true;
    isCredentials:boolean=true;

    isInitTabLock:boolean=false;

    tabApps:Array<classTabApps>=[];
    nbAppsToDisplay:number=0;

    errMsg:string="";

ngOnInit(){
  //console.log('user-functions - init --- configServer.google='+this.configServer.googleServer);
  this.initTabLock();
      
  // TO BE DELETED
  //this.selectApps=29;
  //this.isAppsSelected=true;
  this.initTabApps();
  var lastSelection:number=0;
  if (this.identification.apps[0]==="All"){
    for (var j=0; j<this.tabApps.length; j++){
      this.tabApps[j].display=true;
      lastSelection=j;
      this.nbAppsToDisplay++;
    }
  } else {
    for (var i=0; i<this.identification.apps.length; i++){
      for (var j=0; j<this.tabApps.length && this.identification.apps[i]!==this.tabApps[j].apps ; j++){}
      if (j<this.tabApps.length ){
        this.tabApps[j].display=true;
        lastSelection=j;
        this.nbAppsToDisplay++;
      }
    }
  }

  if ( this.nbAppsToDisplay===1 && this.tabApps[lastSelection].select!==0){
    this.isAppsSelected=true;
    this.selectApps=this.tabApps[lastSelection].select;
  } else if ( this.nbAppsToDisplay===0){
      this.errMsg="This user cannot access any application; update the user file";
  }
  this.posSizeClock.margLeft = 20;
  this.posSizeClock.margTop = 20;
  this.posSizeClock.width = 60;
  this.posSizeClock.height = 60;
  this.posSizeClock.displayAnalog = true;
  this.posSizeClock.displayDigital = true;

}

initTabApps(){
  var tabFn:Array<string>=[];
  var nbFn:Array<number>=[];
  tabFn[0]="General";
  nbFn[3]=0;
  tabFn[1]="Crypto";
  nbFn[3]=6;
  tabFn[2]="Fitness";
  nbFn[3]=24;
  tabFn[3]="Health";
  nbFn[3]=0;
  tabFn[4]="Recipe";
  nbFn[4]=14;
  tabFn[5]="Dictionary";
  nbFn[5]=15;
  tabFn[6]="Canvas";
  nbFn[6]=27;
  tabFn[7]="ConvFn";
  nbFn[7]=10;
  tabFn[8]="UserInfo";
  nbFn[8]=0;
  tabFn[9]="Config";
  nbFn[9]=0;
  tabFn[10]="Photo";
  nbFn[10]=25;
  tabFn[11]="Sport";
  nbFn[11]=0;
  tabFn[12]="fileMgt";
  nbFn[12]=0;
  tabFn[13]="caloriesMgt";
  nbFn[13]=11;
  tabFn[14]="adminServer";
  nbFn[14]=16;
  tabFn[15]="tutorials";
  nbFn[15]=17;
  tabFn[16]="27Aug2022";
  nbFn[16]=26;
  tabFn[17]="manageCUSS";
  nbFn[17]=29;

  for (var i=0; i<tabFn.length; i++){
    const tabClass=new classTabApps;
    tabClass.display=false;
    this.tabApps.push(tabClass);
    this.tabApps[this.tabApps.length-1].apps=tabFn[i];
    this.tabApps[this.tabApps.length-1].select=nbFn[i];
  }

}

initTabLock(){
  if (this.tabLock.length===0){
    for (var i = 0; i <this.maxEventHTTPrequest; i++) {
      const thePush = new classAccessFile;
      this.tabLock.push(thePush);
      if (this.identification.triggerFileSystem === "No") {
      this.tabLock[i].lock = 1;
      } else {
      this.tabLock[i].lock = 3;
      }
      this.tabLock[i].user = this.identification.UserId;
      this.tabLock[i].iWait = i;
      this.tabLock[i].timeoutFileSystem.hh = this.configServer.timeoutFileSystem.hh;
      this.tabLock[i].timeoutFileSystem.mn = this.configServer.timeoutFileSystem.mn;
      this.tabLock[i].IpAddress = this.configServer.IpAddress;
  
      this.tabLock[i].userServerId = this.credentialsFS.userServerId;
      this.tabLock[i].credentialDate = this.credentialsFS.creationDate;
    }
  
    this.tabLock[0].bucket = this.identification.fitness.bucket;
    this.tabLock[0].object = this.identification.fitness.files.fileHealth;
    this.tabLock[0].objectName = this.identification.fitness.files.fileHealth; 
  
    this.tabLock[1].bucket = this.identification.configFitness.bucket;
    this.tabLock[1].object = this.identification.configFitness.files.calories;
    this.tabLock[1].objectName = this.identification.configFitness.files.calories;
  
    this.tabLock[2].bucket = this.identification.configFitness.bucket;
    this.tabLock[2].object = this.identification.configFitness.files.convertUnit;
    this.tabLock[2].objectName = this.identification.configFitness.files.convertUnit;
  
    this.tabLock[3].bucket = this.identification.configFitness.bucket;
    this.tabLock[3].object = this.identification.configFitness.files.confHTML;
    this.tabLock[3].objectName = this.identification.configFitness.files.confHTML;
  
    this.tabLock[4].bucket = this.identification.configFitness.bucket;
    this.tabLock[4].object = this.identification.configFitness.files.confChart;
    this.tabLock[4].objectName = this.identification.configFitness.files.confChart;
  
    this.tabLock[5].bucket = this.identification.configFitness.bucket;
    this.tabLock[5].object = this.identification.fitness.files.myChartConfig;
    this.tabLock[5].objectName = this.identification.fitness.files.myChartConfig; 
  
    this.tabLock[6].bucket = this.identification.configFitness.bucket;
    this.tabLock[6].object = this.identification.fitness.files.recipe;
    this.tabLock[6].objectName = this.identification.fitness.files.recipe;
  
    this.tabLock[10].bucket = this.identification.configFitness.bucket;
    this.tabLock[10].object = this.identification.configFitness.files.convToDisplay;
    this.tabLock[10].objectName = this.identification.configFitness.files.convToDisplay;
  } else {
    for (var i = 0; i <this.maxEventHTTPrequest; i++) {
      if (this.identification.triggerFileSystem === "No") {
        this.tabLock[i].lock = 1;
        } else {
        this.tabLock[i].lock = 3;
        }
    }
  }
  this.isInitTabLock=true;
}

onInput(event:any){
  this.inputSelect=Number(event.target.value);
  this.initTabLock();
  this.selectApps=0;
  this.selHealthFunction=0;
  this.dictionaryOnly=false;
  this.isAppsSelected=false;
}


serverTest:string="";
onSelectApps(){
  this.isAppsSelected=true;
  this.selectApps=this.inputSelect;
  if (this.selectApps===1){
    this.callUserFunction.emit(false);
  }
  if (this.selectApps===16){
    this.serverTest='server';
  } else if (this.selectApps===17){
    this.serverTest='tutorials';
  } else if (this.selectApps===11){
    this.selHealthFunction=5;
  } else if (this.selectApps===12){
    this.selHealthFunction=3;
  } else if (this.selectApps===13){
    this.selHealthFunction=7;
  }  else if (this.selectApps===15){
    this.dictionaryOnly=true;
  }else{
    this.selHealthFunction=0
  } 
}

getServerNames(event:any){
  if (this.configServer.googleServer!==event.google){
    this.configServer.googleServer=event.google;
    //console.log('user-functions - getServerNames --- configServer.google='+this.configServer.googleServer);
    this. serverChange.emit('Google');
  }
  
  if (this.configServer.mongoServer!==event.mongo){
    this.configServer.mongoServer=event.mongo;
    this.serverChange.emit('Mongo');
  }
  
  if (this.configServer.fileSystemServer!==event.fileSystem){
    this.configServer.fileSystemServer=event.fileSystem;
    this.serverChange.emit('FS');
  }
  this.selectApps=0;
  this.configServerChanges++;
}


fnResetServer(event:any){
  /*
  this.isCredentials=false;
  this.isResetServer=true;
  this.isIdRetrieved=false;
  this.getDefaultCredentials(event);
  this.assignNewServerUsrId();
  */
}

fnNewCredentials(credentials:any){
  /*
  this.isResetServer=true;
  this.credentials=credentials;
  */
}
/*
ngOnChanges(changes: SimpleChanges) {   

  for (const propName in changes){
      const j=changes[propName];
  }
}
*/
}

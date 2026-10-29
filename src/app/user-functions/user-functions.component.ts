import { Component, OnInit, ViewChild, AfterViewInit,SimpleChanges,
  signal, Output, Input, HostListener, EventEmitter, ElementRef, } from '@angular/core';

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
//import { KioskAbdConfigComponent } from '../kiosk-abd-config/kiosk-abd-config.component';
import { RunningClockComponent } from '../Health/running-clock/running-clock.component';
import { MyCanvasComponent } from '../my-canvas/my-canvas.component';
import { Event27AugComponent}  from '../Special-Services/Event-27AUG2022.component';
import { GetImagesComponent}  from '../Special-Services/GetImages.component';
import { DictionaryComponent } from '../dictionary/dictionary.component';

import { LoginIdentif , configServer, classUserLogin } from '../JsonServerClass';
import { EventAug, configPhoto, StructurePhotos } from '../JsonServerClass';
import { environment } from '../../environments/environment';
import { classCredentials} from '../JsonServerClass';
import { mainClassConv,mainConvItem, mainRecordConvert, mainClassUnit} from '../ClassConverter';
import { classAccessFile } from '../classFileSystem';
import { drawNumbers, drawHourHand, drawMinuteHand, drawSecondHand, classPosSizeClock} from '../clockFunctions'
import { classDicoRecord } from '../JsonServerClass';

export class classTabApps{
  apps:string="";
  select:number=0;
  display:boolean=false;
}

interface ServerEvent {
  google: string;
  mongo: string;
  fileSystem: string;
}

@Component({
  selector: 'app-user-functions',
  templateUrl: './user-functions.component.html',
  styleUrls: ['./user-functions.component.css'],
  standalone: true, 
  imports:[CommonModule, FormsModule, ReactiveFormsModule, RoutingAppComponent, SelectServerComponent, MainHealthComponent, 
    ConverterComponent, RecipeComponent, TestServerJSComponent, ManageCircuitsComponent, ManagePointOfRefComponent, SportPerformanceComponent,
    SportReportsComponent, SportAnalysisComponent, SportPerfRawDataMgtComponent, FitnessStatComponent, 
     RunningClockComponent, MyCanvasComponent, Event27AugComponent, GetImagesComponent, DictionaryComponent
  ], //KioskAbdConfigComponent,

})

export class UserFunctionsComponent {

    @Input() identification = new LoginIdentif;
    @Input() configServer = new configServer;
    @Input() credentials = new classCredentials;
    @Input() credentialsMongo = new classCredentials;
    @Input() credentialsFS = new classCredentials;
    @Input() configServerChanges:number=0;
    isConfigServerChanges=signal<number>(-1);

    @Input() LoginTable_User_Data:Array<EventAug>=[];
    @Input() LoginTable_DecryptPSW:Array<string>=[];
  
    @Input() ConvToDisplay=new mainConvItem;

    @Input() devMode:string="";

    @Output() serverChange=  new EventEmitter<any>();
    @Output() callUserFunction= new EventEmitter<any>();

    posSizeClock=new classPosSizeClock;

    dicoRecord:Array<classDicoRecord>=[];

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
  console.log('user-functions - init --- configServer.google='+this.configServer.googleServer);
  this.initTabLock();
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
  this.isInitTabLock=true;
}
initTabApps() {
  const appData = [
    { apps: "General", select: 0 },
    { apps: "Crypto", select: 6 },
    { apps: "Fitness", select: 24 },
    { apps: "Health", select: 0 },
    { apps: "Recipe", select: 14 },
    { apps: "Dictionary", select: 15 },
    { apps: "Canvas", select: 27 },
    { apps: "ConvFn", select: 10 },
    { apps: "UserInfo", select: 0 },
    { apps: "Config", select: 0 },
    { apps: "Photo", select: 25 },
    { apps: "Sport", select: 0 },
    { apps: "fileMgt", select: 0 },
    { apps: "caloriesMgt", select: 11 },
    { apps: "adminServer", select: 16 },
    { apps: "tutorials", select: 17 },
    { apps: "27Aug2022", select: 26 },
    { apps: "manageCUSS", select: 29 }
  ];

  this.tabApps = appData.map(item => {
    const tabClass = new classTabApps();
    tabClass.display = false;
    tabClass.apps = item.apps;
    tabClass.select = item.select;
    return tabClass;
  });
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

initTabLock() {
  if (this.tabLock.length !== 0) return;

  const { identification, configServer, credentialsFS, maxEventHTTPrequest } = this;
  const isTriggerNo = identification.triggerFileSystem === "No";
  
  // 1. Initialize the array with structured instances
  for (let i = 0; i < maxEventHTTPrequest; i++) {
    const item = new classAccessFile();
    
    item.lock = isTriggerNo ? 1 : 3;
    item.user = identification.UserId;
    item.iWait = i;
    
    // Deep copy timeout metrics to prevent shared object reference issues
    item.timeoutFileSystem = { ...configServer.timeoutFileSystem };
    item.IpAddress = configServer.IpAddress;
    item.userServerId = credentialsFS.userServerId;
    item.credentialDate = credentialsFS.creationDate;

    this.tabLock.push(item);
  }

  // 2. Map specific file configurations using a declarative mapping array
  const fitnessFiles = identification.configFitness?.files;
  const fileMappings = [
    { bucket: identification.fitness?.bucket, file: identification.fitness?.files?.fileHealth },
    { bucket: identification.fitness?.bucket, file: identification.fitness?.files?.recipe },
    { bucket: identification.fitness?.bucket, file: identification.fitness?.files?.myChartConfig },
    { bucket: identification.configFitness?.bucket, file: fitnessFiles?.calories },
    { bucket: identification.configFitness?.bucket, file: fitnessFiles?.convertUnit },
    { bucket: identification.configFitness?.bucket, file: fitnessFiles?.confHTML },
    { bucket: identification.configFitness?.bucket, file: fitnessFiles?.confChart },
    { bucket: identification.configFitness?.bucket, file: fitnessFiles?.convToDisplay } // myChartConfig
  ];

  // 3. Dynamically assign bucket/object parameters safely
  fileMappings.forEach((mapping, index) => {
    if (this.tabLock[index] && mapping.file) {
      this.tabLock[index].bucket = mapping.bucket;
      this.tabLock[index].object = mapping.file;
      this.tabLock[index].objectName = mapping.file;
    }
  });
}


getServerNames(event: ServerEvent): void {
  // 1. Map event properties to config keys and emission values
  const serverMappings = [
    { key: 'googleServer', eventVal: event.google, emitVal: 'Google' },
    { key: 'mongoServer', eventVal: event.mongo, emitVal: 'Mongo' },
    { key: 'fileSystemServer', eventVal: event.fileSystem, emitVal: 'FS' }
  ] as const;

  // 2. Loop through mappings to update values and emit changes dynamically
  for (const { key, eventVal, emitVal } of serverMappings) {
    if (this.configServer[key] !== eventVal) {
      this.configServer[key] = eventVal;
      this.serverChange.emit(emitVal);
    }
  }

  // 3. Update state counters cleanly
  this.selectApps = 0;
  this.configServerChanges++;
  this.isConfigServerChanges.update(prev => prev + 1);
}
returnDicoFile(dico:any){
  const a = dico;
}


fnResetServer(event:any){
// for future developments
}

fnNewCredentials(credentials:any){
// for future developments
}

}


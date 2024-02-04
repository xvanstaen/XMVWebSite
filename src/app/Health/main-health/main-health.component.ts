import {
  Component, OnInit, Input, Output, HostListener, OnDestroy, HostBinding, ChangeDetectionStrategy,
  SimpleChanges, EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID
} from '@angular/core';

import { DatePipe, formatDate } from '@angular/common';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { Observable } from 'rxjs';

import { BucketList, Bucket_List_Info } from '../../JsonServerClass';

// configServer is needed to use ManageGoogleService
// it is stored in MongoDB and accessed via ManageMongoDBService

import { msginLogConsole } from '../../consoleLog'
import { configServer, LoginIdentif, msgConsole, classCredentials, classtheEvent } from '../../JsonServerClass';
import { classPosDiv, getPosDiv } from '../../getPosDiv';

import { getStyleDropDownContent, getStyleDropDownBox, classDropDown } from '../../DropDownStyle'

import { ClassSubConv, ClassConv, mainClassConv, mainConvItem, ClassUnit, ConvItem } from '../../ClassConverter'

import { ClassCaloriesFat, mainClassCaloriesFat } from '../ClassHealthCalories'
import { ClassItem, DailyReport, mainDailyReport, ClassMeal, ClassDish } from '../ClassHealthCalories'

import { classConfHTMLFitHealth, classConfTableAll } from '../classConfHTMLTableAll';

import { CalcFatCalories } from '../CalcFatCalories';
import { classConfigChart, classchartHealth } from '../classConfigChart';
import { classAxis, classLegendChart, classPluginTitle, classTabFormChart, classFileParamChart } from '../classChart';
import { classFileSystem, classAccessFile, classReturnDataFS } from '../../classFileSystem';

import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { AccessConfigService } from 'src/app/CloudServices/access-config.service';

import { fnAddTime, convertDate, strDateTime, fnCheckLockLimit, fnCheckTimeOut, defineMyDate, formatDateInSeconds, formatDateInMilliSeconds, findIds } from '../../MyStdFunctions';
import { FillHealthAllInOut } from 'src/app/copyFilesFunction';
@Component({
  selector: 'app-main-health',
  templateUrl: './main-health.component.html',
  styleUrls: ['./main-health.component.css']
})
export class MainHealthComponent {

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
  ) { }

  @Output() returnFile = new EventEmitter<any>();
  @Output() resetServer = new EventEmitter<any>();
  @Output() newCredentials = new EventEmitter<any>();

  @Input() configServer = new configServer;
  @Input() identification = new LoginIdentif;
  @Input() triggerFunction: number = 0;
  
  @Input() credentials = new classCredentials;
  @Input() credentialsMongo = new classCredentials;
  @Input() credentialsFS = new classCredentials;

  InHealthAllData = new mainDailyReport; // initial object
  HealthAllData = new mainDailyReport; // modifiable object

  convToDisplay=new mainConvItem;

  tabNewRecordAll: Array<any> = [
    {
      nb: 0,
      meal: [{
        nb: 0,
        food: [{ nb: 0, }]
      }]
    }
  ];

  returnDataFSHealth=new classReturnDataFS;
  returnDataFSCalFat=new classReturnDataFS;
  returnDataFSParamChart=new classReturnDataFS;
  returnDataFSRecipe=new classReturnDataFS;

  returnData = {
    error: 0,
    outHealthData: new DailyReport
  }

  ConfigCaloriesFat = new mainClassCaloriesFat;
  fileRecipe = new mainClassCaloriesFat;
  
  ConfigHTMLFitHealth = new classConfHTMLFitHealth;

  confTableAll = new classConfTableAll;

  ConfigChart = new classConfigChart;

  fileParamChart = new classFileParamChart;
  
  ConvertUnit = new mainClassConv;

  myLogConsole: boolean = false;
  myConsole: Array<msgConsole> = [];
  returnConsole: Array<msgConsole> = [];
  SaveConsoleFinished: boolean = false;
  type: string = '';

  HTTP_Address: string = '';
  HTTP_AddressPOST: string = '';
  Google_Bucket_Access_Root: string = 'https://storage.googleapis.com/storage/v1/b/';
  Google_Bucket_Access_RootPOST: string = 'https://storage.googleapis.com/upload/storage/v1/b/';
  Google_Object_Health: string = 'HealthTracking';
  Google_Object_Console: string = 'LogConsole';
  Google_Object_Calories: string = 'ConfigCaloriesFat';
  bucket_data: string = '';
  myListOfObjects = new Bucket_List_Info;
  DisplayListOfObjects: boolean = false;
  Error_Access_Server: string = '';

  errorMsg: string = '';

  EventHTTPReceived: Array<boolean> = [];
  EventStopWaitHTTP: Array<boolean> = [];
  maxEventHTTPrequest: number = 20;
  id_Animation: Array<number> = [];
  TabLoop: Array<number> = [];
  NbWaitHTTP: number = 0;

  saveServer={
    google:"",
    mongo:"",
    FS:""
  }
  tabLock: Array<classAccessFile> = []; //0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked;

  prevDialogue: number = 0;
  dialogue: Array<boolean> = [false, false, false, false, false, false, false]; // CREdate=0; CREmeal=1; CREingr=2; SELdate=3; SELmeal=4; SELingr=5; allData=6
  isconfirmSaveA:boolean=false;
  isconfirmSave:boolean=false;
  isDisplayAll:boolean=false;

  isCopyFile:boolean=false;
  isMgtCaloriesFat:boolean=false;
  IsCalculateCalories:boolean=false;
  isAllDataModified :boolean=false;
  isDisplayChart:boolean=false;
  isSaveCaloriesFat:boolean=false;
  isSaveParamChart:boolean=false;
  isSaveRecipeFile:boolean=false;
  IsSaveConfirmedAll:boolean=false;
  isSaveHealth:boolean=false;

  isMustSaveFile:boolean=false;


  calfatNameFile: string = '';
  errCalcCalFat:string = '';

  processDestroy: boolean = false;
  passDestroy: number = 0;

  callFileSystem:boolean=false;

  SpecificForm = new FormGroup({
    FileName: new FormControl('', { nonNullable: true }),
  })

  TheSelectDisplays: FormGroup = new FormGroup({

    DisplayAll: new FormControl('N', { nonNullable: true }),
    CopyFile: new FormControl('N', { nonNullable: true }),
    MgtCalories: new FormControl('N', { nonNullable: true }),
    CalculCalories: new FormControl('N', { nonNullable: true }),
    SelectedDate: new FormControl(Date(), { nonNullable: true }),
    theAction: new FormControl('Action', { nonNullable: true }),
    DisplayChart: new FormControl('N', { nonNullable: true }),
    ReloadHTML: new FormControl('N', { nonNullable: true }),
    ReloadChart: new FormControl('N', { nonNullable: true }),
    searchString: new FormControl('', { nonNullable: true }),
    startRange: new FormControl('', [
      Validators.required,
      // validates date format yyyy-mm-dd with regular expression
      Validators.pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
    ]),
    endRange: new FormControl('', [
      Validators.required,
      // validates date format yyyy-mm-dd with regular expression
      Validators.pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
    ]),

  })

  theEvent = new classtheEvent;

  saveEvent: any;

  eventLockLimit={
    iWait:0,
    isDataModified:false,
    isSaveFile:false,
    lastInputAt:"",
  }

  recipeNameFile: string = '';
  
  // used by ngChange on health.component
  healthFileRetrieved:number=0;
  createDropDownCalFat:number=0;
  actionHealth:number=0;
  resetBooleans:number=0;
  calculateHeight:number=0;
  recipeFileRetrieved:number=0;
  calFatFileRetrieved:number=0;

  resultFileSystemHealth:number=0;
  resultFileSystemCalFath:number=0;
  resultFileSystemParamChart:number=0;
  resultFileSystemRecipe:number=0;
  iWait:number=0;

  paramChartFileRetrieved:number=0;
  actionParamChart:number=0;

  actionCalFat:number=0;
  actionRecipe:number=0;

  counterActions:number=0;

  ngOnInit(): void {
    // used to open files in parallel using the google and mongo servers
    this.saveServer.google=this.configServer.googleServer;
    this.saveServer.mongo=this.configServer.mongoServer;
    this.saveServer.FS=this.configServer.fileSystemServer;

    for (var i = 0; i < 7; i++) {
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
      
      // this.tabLock[i].credentialDate = this.identification.credentialDate;

      // to be used to access FileSystem
      this.tabLock[i].userServerId = this.credentialsFS.userServerId;
      this.tabLock[i].credentialDate = this.credentialsFS.creationDate;
    }
    this.tabLock[0].objectName = this.identification.fitness.files.fileHealth; // + this.identification.UserId;
    this.tabLock[1].objectName = this.identification.configFitness.files.calories;
    this.tabLock[5].objectName = this.identification.fitness.files.myChartConfig; //  + this.identification.UserId;
    
    this.tabLock[0].bucket = this.identification.fitness.bucket;
    this.tabLock[0].object = this.identification.fitness.files.fileHealth;

    this.tabLock[1].bucket = this.identification.configFitness.bucket;
    this.tabLock[1].object = this.identification.configFitness.files.calories;

    this.tabLock[2].bucket = this.identification.configFitness.bucket;
    this.tabLock[2].object = this.identification.configFitness.files.convertUnit;

    this.tabLock[3].bucket = this.identification.configFitness.bucket;
    this.tabLock[3].object = this.identification.configFitness.files.confHTML;

    this.tabLock[4].bucket = this.identification.configFitness.bucket;
    this.tabLock[4].object = this.identification.configFitness.files.confChart;

    this.tabLock[5].bucket = this.identification.configFitness.bucket;
    this.tabLock[5].object = this.identification.fitness.files.myChartConfig;


    this.tabLock[6].bucket = this.identification.configFitness.bucket;
    this.tabLock[6].object = this.identification.fitness.files.recipe;


    for (var i = 0; i < this.maxEventHTTPrequest; i++) {
      this.EventHTTPReceived[i] = false;
      this.EventStopWaitHTTP[i] = false;
      this.TabLoop[i]=0;
    }

    this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.fileHealth, 0);
    this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.confHTML, 3);
    if (this.triggerFunction !== 0) {
      if (this.triggerFunction === 3) {
        this.TheSelectDisplays.controls['DisplayAll'].setValue('Y');
      } else if (this.triggerFunction === 5) {
        this.TheSelectDisplays.controls['MgtCalories'].setValue('Y');
      } else if (this.triggerFunction === 7) {
        this.TheSelectDisplays.controls['DisplayChart'].setValue('Y');
      }
      const theSelection = 'Y-' + this.triggerFunction;
      this.SelRadio(theSelection.trim());
    }

    this.SelectDisplay();
  }

  resultFileSystem(event:any){
    this.callFileSystem=false;
    this.tabLock[this.iWait] = event.tabLock[this.iWait];
    if (this.confirmSaveAction===false){
      if (this.iWait===0){
          this.returnDataFSHealth = event;
      } else if (this.iWait===1){
        this.returnDataFSCalFat = event;
      } else if (this.iWait===5){
        this.returnDataFSParamChart = event;
      }  else if (this.iWait===6){
        this.returnDataFSRecipe = event;
      } 
    } else if (event.tabLock[this.iWait].lock===1){ // insert a test if .lock!==1 ==> cancel the update 
      if (this.iWait===0){
        this.processSaveHealth(this.theEvent);
      } else if (this.iWait===1){
        this.processSaveCaloriesFat(this.theEvent);
      } else if (this.iWait===5){
        this.processSaveParamChart();
      } else if (this.iWait===6){
        this.SaveRecipeFile(this.theEvent);
      } 
    }
    
    if (event.reAccessFile===true){
      if (this.iWait === 0) {
        this.reAccessHealthFile();
      } else if (this.iWait === 1) {
        this.reAccessConfigCal();
      } else if (this.iWait === 5) {
        this.reAccessChartFile();
      } else if (this.iWait === 6) {
        this.reAccessRecipe();
      }
    }
  }
  
  SelectDisplay() {
    if (this.TheSelectDisplays.controls['DisplayAll'].value === 'Y') {
      this.isDisplayAll = true;
    } else {
      this.isDisplayAll = false;
    }
  }

  SelRadio(event: any) {
    // this.checkLockLimit(0);
    this.callFileSystem=false;
    const i = event.substring(2);
    this.errorMsg = '';
    const NoYes = event.substring(0, 1);
    if (i === '3') {
      if (NoYes === 'Y') {
        this.dialogue[this.prevDialogue] = false;
        this.isDisplayAll = true;
        if (this.tabLock[0].lock !== 1) {
          this.tabLock[0].action='lock';
          this.iWait=0;
          this.callFileSystem=true;
          //this.lockFile(0);
        }
      } else {
        if (this.tabLock[0].lock === 1) {
          //this.unlockFile(0);
          this.tabLock[0].action='unlock';
          this.iWait=0;
          this.callFileSystem=true;
        }
        this.isDisplayAll = false;
      }
    } else if (i === '4') {
      if (NoYes === 'Y') {
        this.isCopyFile = true;
        const fileName = 'COPY ' + this.SpecificForm.controls['FileName'].value;
        this.SpecificForm.controls['FileName'].setValue(fileName);

      } else {
        this.isCopyFile = false;
      }
    } else if (i === '5') {
      if (NoYes === 'Y') {
        this.isMgtCaloriesFat = true;
        if (this.tabLock[1].lock !== 1) {
          //this.lockFile(1);
          this.tabLock[1].action='lock';
          this.iWait=1;
          this.callFileSystem=true;
        }
      } else {
        this.isMgtCaloriesFat = false;
        if (this.tabLock[1].lock === 1) {
          //this.unlockFile(1);
          this.tabLock[1].action='unlock';
          this.iWait=1;
          this.callFileSystem=true;
        }
      }
    } else if (i === '6') {
      if (NoYes === 'Y') {
        if (this.tabLock[0].lock !== 1) {
          this.tabLock[0].action='lock';
          this.iWait=0;
          this.callFileSystem=true;
          //this.lockFile(0);
        }
        this.errCalcCalFat = '';
        for (var j = 0; j < this.HealthAllData.tabDailyReport.length; j++) {
          this.calculateHealth(this.HealthAllData.tabDailyReport[j]);
          if (this.errorMsg !== '') {
            this.errCalcCalFat = 'errors found while caculating calories and fat';
          }
          this.HealthAllData.tabDailyReport[j].total = this.returnData.outHealthData.total;
          this.HealthAllData.tabDailyReport[j].meal = this.returnData.outHealthData.meal;
        }
        this.IsCalculateCalories = true;
        this.tabNewRecordAll.splice(0,this.tabNewRecordAll.length);
        this.initTrackRecord();
      }
    } else if (i === '8') {
      if (NoYes === 'Y') { // HTML file reload file
        this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.confHTML, 3);
      }
    } else if (i === '7') {
      if (NoYes === 'Y') {
        if (this.EventHTTPReceived[4] === false) {
          this.getChartFiles();
        }
        this.isDisplayChart = true;
        if (this.tabLock[5].lock !== 1) {
          this.tabLock[5].action='lock';
          this.iWait=5;
          this.callFileSystem=true;
          //this.lockFile(5);
        }
      }
      else {
        this.isDisplayChart = false;
        if (this.tabLock[5].lock === 1) {
          //this.unlockFile(5);
          this.tabLock[5].action='unlock';
          this.iWait=5;
          this.callFileSystem=true;
        }
      }
    } else if (i === '9') {
      if (NoYes === 'Y') { // reload confirguration chart
        this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.confChart, 4);
        if (this.tabLock[4].lock !== 1) {
          //this.lockFile(4);
          this.tabLock[5].action='lock';
          this.iWait=5;
          this.callFileSystem=true;
        }
      }
      else {
        if (this.tabLock[4].lock === 1) {
          //this.unlockFile(4);
          this.tabLock[4].action='unlock';
          this.iWait=4;
          this.callFileSystem=true;
        }
      }
    }
  }

  calculateHealth(selRecord: DailyReport) {
    this.returnData = CalcFatCalories(this.ConfigCaloriesFat, selRecord, this.ConvertUnit);
    if (this.returnData.error > 0) {
      this.errorMsg = this.returnData.error + ' nb of errors detected';
    }
  }

  checkLockLimit(event:any) {
    const iWait=event.iWait;
    const isDataModified=event.isDataModified; 
    const isSaveFile=event.isSaveFile;
    const lastInputAt=event.lastInputAt;


    var valueCheck = { action: '', lockValue: 0, lockAction: '' };
    if (this.identification.triggerFileSystem === "No") { //"No"
      valueCheck.action = "noAction";
    } else {
      valueCheck = fnCheckLockLimit(this.configServer, this.tabLock, iWait, lastInputAt, isDataModified, isSaveFile);
      //if (iWait === 0 && this.tabLock[iWait].lock === 2) {
      //  this.isAllDataModified = false;
      //}
    }
    if (valueCheck.action !== 'noAction') {
      if (valueCheck.action === 'updateSystemFile') {
        this.tabLock[iWait].action = valueCheck.lockAction;
        //this.onFileSystem(iWait);
        this.callFileSystem=true; 
      } else if (valueCheck.action === 'checkFile') {
        if ((iWait === 0 && this.isSaveHealth === false) || (iWait === 1 && this.isSaveCaloriesFat === false) || (iWait === 5 && this.isSaveParamChart === false)) {
          //this.checkUpdateFile(iWait)
          this.tabLock[iWait].action = 'check&update';
          this.callFileSystem=true; 
        } else {
          //this.checkFile(iWait);
          this.tabLock[iWait].action = 'check';
          this.callFileSystem=true; 
        }
      } else if (valueCheck.action === 'changeTabLock') {
        this.tabLock[iWait].lock = valueCheck.lockValue;
      } else if (iWait === 0 && valueCheck.action === 'ProcessSave') {
        this.processSaveHealth(this.theEvent);
      } else if (iWait === 5 && valueCheck.action === 'ProcessSave') {
        this.processSaveParamChart();
      } else if (iWait === 1 && valueCheck.action === 'ProcessSave') {
        this.processSaveCaloriesFat(this.theEvent);
      } //else if (iWait === 0 && valueCheck.action === 'confirmSave') {
        //this.isMustSaveFile = true;
        //this.theEvent.target.id = 'All'; // ===== change value of target.id if created record or if selRecord  
        //this.confirmSave(this.theEvent);
      //}
    //} else if (this.isconfirmSaveA === true) {
    //  this.confirmSave(this.theEvent);
    } else {
      this.counterActions++
      if (iWait === 0){
        this.actionHealth=this.counterActions;
      } else if (iWait === 1){
        this.actionCalFat=this.counterActions;
      } if (iWait === 5){
        this.actionParamChart=this.counterActions;
      } 
        
    }
    /*
    if (this.onInputAction === "onInputDailyAll") {
      this.onInputAction = "";
      this.onInputDailyAllA(this.theEvent);
    } else if (this.onInputAction === "onAction") {
      this.onInputAction = "";
      this.onActionA(this.theEvent);
    } 
    */
  }
  


  accessAllOtherFiles() {
    this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.calories, 1);
    this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.recipe, 6);
    this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.convertUnit, 2);
    this.getRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.convToDisplay,10);
  }

  retrieveRecord(event:any){
    if (event===0){
      this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.fileHealth, 0);
    } else if (event===1){
      this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.calories, 1);
    } else if (event===5){
      this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.myChartConfig, 5);
    } else if (event===6){
      this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.recipe, 6);
    } else if (event===10){
      this.getRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.convToDisplay,10);
    }
  }

  getRecord(Bucket: string, GoogleObject: string, iWait: number) {
    console.log('getRecord - iWait='+iWait);
    this.EventHTTPReceived[iWait] = false;
    this.EventStopWaitHTTP[iWait]=false;
    this.NbWaitHTTP++;
    if (iWait===0 || iWait===4){
      this.configServer.googleServer=this.saveServer.FS;
    }
    this.waitHTTP(this.TabLoop[iWait], 3000, iWait);
    this.ManageGoogleService.getContentObject(this.configServer, Bucket, GoogleObject)
      .subscribe((data) => {
        console.log('getRecord - data received for iWait='+iWait);
        this.EventStopWaitHTTP[iWait]=true;
        
        var noPb=true;
        if (data.status!==undefined && data.status!==200){
          this.errorMsg = data.msg;
          noPb=false;
        } else
          if (iWait === 0) {
            console.log('file HealthAllData received');
            this.configServer.googleServer=this.saveServer.google;
            this.HealthAllData.tabDailyReport.splice(0,this.HealthAllData.tabDailyReport.length);
            this.HealthAllData = FillHealthAllInOut(this.HealthAllData, data);
    
            //this.HealthAllData=data;
            this.HealthAllData.tabDailyReport.sort((a, b) => (a.date > b.date) ? -1 : 1);
            if (this.HealthAllData.fileType === '') {
              this.HealthAllData.fileType = this.identification.fitness.fileType.Health;
            }
            if (this.InHealthAllData.fileType === '') {
              this.InHealthAllData = FillHealthAllInOut(this.InHealthAllData,  this.HealthAllData);
            }
            //this.resetBooleans();
            this.resetBooleans++
            //if (this.tabLock[0].lock === 1) {
              this.tabNewRecordAll.splice(0, this.tabNewRecordAll.length);
              this.initTrackRecord();
            //}

            this.SpecificForm.controls['FileName'].setValue(this.identification.fitness.files.fileHealth);
            this.healthFileRetrieved++
            //****************** iWait === 1 *************************/
          } else if (iWait === 1) {
            this.ConfigCaloriesFat.tabCaloriesFat.splice(0, this.ConfigCaloriesFat.tabCaloriesFat.length)
            if (data.fileType !== '') {
              this.ConfigCaloriesFat.fileType = data.fileType;
            } else {
              this.ConfigCaloriesFat.fileType = this.identification.fitness.fileType.FitnessMyConfig;
            }
            if (data.updatedAt !== undefined) {
              this.ConfigCaloriesFat.updatedAt = data.updatedAt;
            } else {
              this.ConfigCaloriesFat.updatedAt = '';
            }
            this.ConfigCaloriesFat.tabCaloriesFat = data.tabCaloriesFat;
            this.calFatFileRetrieved++
            //this.CreateDropDownCalFat();
            this.createDropDownCalFat++
            //****************** iWait === 2 *************************/
          } else if (iWait === 2) {
            this.ConvertUnit.tabConv.splice(0, this.ConvertUnit.tabConv.length);
            this.ConvertUnit = data;
            if (data.fileType !== '') {
              this.ConvertUnit.fileType = data.fileType
            } else {
              this.ConvertUnit.fileType = this.identification.configFitness.fileType.convertUnit;
            }
            if (data.updatedAt !== undefined) {
              this.ConvertUnit.updatedAt = data.updatedAt;
            } else {
              this.ConvertUnit.updatedAt = '';
            }
            this.ConvertUnit.tabConv = data.tabConv;
          }
          //****************** iWait === 3 *************************/
          else if (iWait === 3) {
            //this.ConfigHTMLFitHealth=data;
            this.ConfigHTMLFitHealth.fileType == data.fileType;
            this.ConfigHTMLFitHealth.debugPhone == data.debugPhone;
            this.ConfigHTMLFitHealth.ConfigHealth.fileType == data.ConfigHealth.fileType;
            if (data.ConfigHealth.updatedAt !== undefined) {
              this.ConfigHTMLFitHealth.ConfigHealth.updatedAt == data.ConfigHealth.updatedAt;
            } else {
              this.ConfigHTMLFitHealth.ConfigHealth.updatedAt = '';
            }
            this.ConfigHTMLFitHealth.ConfigHealth.confTableAll = data.ConfigHealth.confTableAll;

            this.ConfigHTMLFitHealth.ConfigCalFat.fileType == data.ConfigCalFat.fileType;
            if (data.ConfigCalFat.updatedAt !== undefined) {
              this.ConfigHTMLFitHealth.ConfigCalFat.updatedAt == data.ConfigCalFat.updatedAt;
            } else {
              this.ConfigHTMLFitHealth.ConfigCalFat.updatedAt = '';
            }
            this.ConfigHTMLFitHealth.ConfigCalFat.confCaloriesFat = data.ConfigCalFat.confCaloriesFat;

            this.confTableAll = this.ConfigHTMLFitHealth.ConfigHealth.confTableAll;
            //this.calculateHeight();
            this.calculateHeight++
          //****************** iWait === 4 *************************/
          } else if (iWait === 4) {
            this.configServer.googleServer=this.saveServer.google;

            this.ConfigChart.fileType = data.fileType;
            if (data.updatedAt !== undefined) {
              this.ConfigChart.updatedAt = data.updatedAt;
            } else {
              this.ConfigChart.updatedAt = '';
            }
            this.ConfigChart.chartHealth = data.chartHealth;
          }
          //****************** iWait === 5 *************************/
          else if (iWait === 5) {
            this.fileParamChart.fileType = data.fileType;
            if (data.updatedAt !== undefined) {
              this.fileParamChart.updatedAt = data.updatedAt;
            } else {
              this.fileParamChart.updatedAt = '';
            }
            this.fileParamChart.data = data.data;
          //****************** iWait === 6 *************************/   
          } else if (iWait === 6) {
            this.fileRecipe.fileType = data.fileType;
            if (data.updatedAt !== undefined) {
              this.fileRecipe.updatedAt = data.updatedAt;
            } else {
              this.fileRecipe.updatedAt = '';
            }
            this.fileRecipe.tabCaloriesFat = data.tabCaloriesFat;
            this.recipeFileRetrieved++
            //****************** iWait === 7 ** SHOULD IT BE DELETED - SEEMS TO BE OLD CODE ***********************/
          } else if (iWait === 7) {
            if (this.tabLock[0].updatedAt >= data.updatedAt) {
              // file has not been updated by another user
              if (this.isMustSaveFile === true) {
                this.theEvent.target.id = 'All'; // ===== change value of target.id if created record or if selRecord
                this.confirmSave(this.theEvent);
              } else if (this.isSaveHealth === true) {
                this.processSaveHealth(this.theEvent);
              } else if (this.tabLock[0].lock === 1 && this.isAllDataModified === true) {
              
                //this.updateLockFile(0); // extend the timeout as no modification has been made by any other user after timeout
                this.tabLock[0].action='updatedAt';
                this.callFileSystem = true;
              }
            } else { // updates made by another user after timeout
              this.HealthAllData.tabDailyReport.splice(0, this.HealthAllData.tabDailyReport.length);
              this.HealthAllData=FillHealthAllInOut(this.HealthAllData, data);
              this.tabLock[0].lock = 0;
              this.errorMsg = 'TIMEOUT - Your updates are lost because in the meantime the file was updated by another user ';
              //this.resetBooleans();
              this.resetBooleans++
            }
            //****************** iWait === 8 ** SHOULD IT BE DELETED - SEEMS TO BE OLD CODE ***********************/
          } else if (iWait === 8) {
            if (this.tabLock[5].updatedAt >= data.updatedAt) {
              // file has not been updated by another user
              if (this.isSaveParamChart === true) {
                this.processSaveHealth(this.theEvent);
              } else if (this.tabLock[5].lock === 1) {
                //
                //this.updateLockFile(5); // extend the timeout as no modification has been made by any other user after timeout
                this.tabLock[5].action='updatedAt';
                this.callFileSystem = true;
              }
            } else { // updates made by another user after timeout
              this.fileParamChart.data.splice(0, this.fileParamChart.data.length);
              this.fileParamChart.data = data.data;
              this.tabLock[5].lock = 0;

            }
            //****************** iWait === 9 ** SHOULD IT BE DELETED - SEEMS TO BE OLD CODE ***********************/
          } else if (iWait === 9) {
            if (this.tabLock[1].updatedAt >= data.updatedAt) {
              // file has not been updated by another user
              if (this.isSaveCaloriesFat === true) {
                this.processSaveCaloriesFat(this.theEvent);
              } else if (this.tabLock[1].lock === 1) {
                //this.updateLockFile(1); // extend the timeout as no modification has been made by any other user after timeout
                this.tabLock[1].action='updatedAt';
                this.callFileSystem = true;
              }
            } else { // updates made by another user after timeout
              this.ConfigCaloriesFat.tabCaloriesFat.splice(0, this.ConfigCaloriesFat.tabCaloriesFat.length);
              this.ConfigCaloriesFat.tabCaloriesFat = data.tabCaloriesFat;
              this.tabLock[1].lock = 0;
            }
            //****************** iWait === 10 *************************/  
          } else if (iWait === 10) { 
            this.convToDisplay=data;
          }
          if (noPb===true){
              if (iWait !== 7 && iWait !== 8 && iWait !== 9) {
                // this.returnFile.emit(data); // not needed as files are stored in cache of backend server
              }
              console.log('getRecord - data processed for iWait='+iWait + '  EventHTTPReceived=true');
              this.EventHTTPReceived[iWait] = true;
              if (iWait===0){
                this.accessAllOtherFiles();
              }
          } 
        },
        err => {
          this.EventStopWaitHTTP[iWait]=true;
          if (iWait === 0) {
            this.errorMsg = 'Problem to retrieve file ' + this.identification.fitness.files.fileHealth ;

          } else if (iWait === 1) {
            this.errorMsg = 'Problem to retrieve file ' + this.identification.configFitness.files.calories ;

          } else {
            this.errorMsg = 'Problem to retrieve file - iWait=' +iWait;
          }
          console.log('get record '+this.errorMsg + " error="+JSON.stringify(err));
        }
      )
  }

  initTrackRecord() {
    for (var i = 0; i < this.HealthAllData.tabDailyReport.length; i++) {
      if (this.tabNewRecordAll.length === 0 || i !== 0) {
        const trackNew = { nb: 0, meal: [{ nb: 0, food: [{ nb: 0 }] }] };
        this.tabNewRecordAll.push(trackNew);
      }

      for (var j = 0; j < this.HealthAllData.tabDailyReport[i].meal.length; j++) {
        if (this.tabNewRecordAll[i].meal.length === 0 || j !== 0) {
          const trackNew = { nb: 0, food: [{ nb: 0 }] };
          this.tabNewRecordAll[i].meal.push(trackNew);
        }
        for (var k = 0; k < this.HealthAllData.tabDailyReport[i].meal[j].dish.length; k++) {
          if (this.tabNewRecordAll[i].meal[j].food.length === 0 || k !== 0) {
            const trackNew = { nb: 0 };
            this.tabNewRecordAll[i].meal[j].food.push(trackNew);
          }
        }
      }
    }
  }

  getChartFiles() {
      this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.confChart, 4);
      this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.myChartConfig, 5);
  }

  reAccessHealthFile() {
    console.log('reAccessHealthFile');
    this.HealthAllData.tabDailyReport.splice(0, this.HealthAllData.tabDailyReport.length);
    this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.fileHealth, 0);
  }

  reAccessChartFile() {
    this.fileParamChart.data.splice(this.fileParamChart.data.length);
    this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.myChartConfig, 5);
  }

  reAccessConfigCal() {
    this.ConfigCaloriesFat.tabCaloriesFat.splice(this.ConfigCaloriesFat.tabCaloriesFat.length);
    this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.calories, 1);
  }

  reAccessRecipe(){
    this.fileRecipe.tabCaloriesFat.splice(0,this.fileRecipe.tabCaloriesFat.length);
    this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.recipe, 6);
  }
  
/*
  saveParamChart(event: any) {
    this.isSaveParamChart = true;
    this.fileParamChart.data = event;

    if (this.identification.triggerFileSystem === "No") {
      this.processSaveParamChart();
    } else {
      this.eventLockLimit.iWait=5;
      this.eventLockLimit.isDataModified=true;
      this.eventLockLimit.isSaveFile=true;
      this.eventLockLimit.lastInputAt=event.lastInput;
      this.checkLockLimit(this.eventLockLimit);
    }
  }
*/

  processSaveParamChart() {
    this.errorMsg="";
    this.fileParamChart.fileType = this.identification.fitness.fileType.myChart;
    this.fileParamChart.updatedAt = strDateTime();
    // this.fileParamChart.data=event; this.identification.fitness.files.myChartConfig  event.fileName
    this.SaveNewRecord(this.identification.fitness.bucket, this.identification.fitness.files.myChartConfig, this.fileParamChart, 5);
  }


  SaveCaloriesFat(event: any) {
    this.isSaveCaloriesFat = true;
    if (event.fileType === undefined) {
      this.calfatNameFile = event;
    }
    if (this.identification.triggerFileSystem === "No") {
      this.processSaveCaloriesFat(event);
    } else {
      this.eventLockLimit.iWait=1;
      this.eventLockLimit.isDataModified=true;
      this.eventLockLimit.isSaveFile=true;
      this.eventLockLimit.lastInputAt=event.lastInput;
      this.checkLockLimit(this.eventLockLimit);
    }
  }

  processSaveCaloriesFat(event: any) {
      if (this.ConfigCaloriesFat.fileType === '') {
        this.ConfigCaloriesFat.fileType = this.identification.configFitness.fileType.calories;
      }
      this.ConfigCaloriesFat.updatedAt = strDateTime();
      this.SaveNewRecord(this.identification.configFitness.bucket, event.fileName, this.ConfigCaloriesFat, 1);
  }

  SaveRecipeFile(event: any) {
      if (this.fileRecipe.fileType === '') {
        this.fileRecipe.fileType = this.identification.fitness.fileType.recipe;
      }
      this.fileRecipe.updatedAt = strDateTime();
      this.SaveNewRecord(this.identification.fitness.bucket, event.fileName, this.fileRecipe, 6);
  }

  confirmSaveAction:boolean=false;

  confirmSave(event: any) {
    if (this.tabLock[event.checkLock.iWait].lock === 1) {
      this.confirmSaveAction = true;
      this.checkLockLimit({iWait:event.checkLock.iWait,isDataModified:event.checkLock.isDataModified,isSaveFile:event.checkLock.isSaveFile, lastInputAt:event.checkLock.lastInputAt});
      this.confirmSaveAction = false;
    } 

  }

  saveCopy(iWait:number) {
    if (iWait===0){
      this.HealthAllData.tabDailyReport.sort((a, b) => (a.date > b.date) ? -1 : 1);
      if (this.HealthAllData.fileType !== '') {
        this.HealthAllData.fileType = this.identification.fitness.fileType.Health;
      }
      this.HealthAllData.updatedAt = strDateTime();
      this.SaveNewRecord(this.identification.fitness.bucket, this.SpecificForm.controls['FileName'].value, this.HealthAllData, -1);
    }
  }


  cancelUpdates(iWait:number){
    if (iWait === 0) {
      this.HealthAllData.tabDailyReport.splice(0, this.HealthAllData.tabDailyReport.length)
      this.HealthAllData = FillHealthAllInOut(this.HealthAllData, this.InHealthAllData);
      this.tabNewRecordAll.splice(0, this.tabNewRecordAll.length);
      this.initTrackRecord();
      this.IsSaveConfirmedAll = false;
    } 
  }

  processSave(event: any) {
    this.confirmSaveAction = true;
    this.theEvent=event;
    this.checkLockLimit({iWait:event.checkLock.iWait,isDataModified:event.checkLock.isDataModified,isSaveFile:event.checkLock.isSaveFile, lastInputAt:event.checkLock.lastInputAt});
    this.confirmSaveAction = false;
    this.iWait=event.checkLock.iWait;
    if (this.callFileSystem===true){
      
    }
  }

  processSaveHealth(event: any) {
    this.errorMsg = '';
    this.errCalcCalFat = '';
    var trouve = false;
    var i = 0
   
    this.IsSaveConfirmedAll = false;
    for (var i = 0; i < this.HealthAllData.tabDailyReport.length; i++) {
       trouve = false;
      if (this.tabNewRecordAll[i].nb === 1) {
        trouve = true;
      } else {
        for (var j = 0; j < this.HealthAllData.tabDailyReport[i].meal.length && trouve === false; j++) {
          if (this.tabNewRecordAll[i].meal[j].nb === 1) {
            trouve = true;
          }
          for (var k = 0; k < this.HealthAllData.tabDailyReport[i].meal[j].dish.length && trouve === false; k++) {
            if (this.tabNewRecordAll[i].meal[j].food[k].nb === 1) {
                trouve = true;
            }
          }
        }
      }
      if (trouve === true) {
          this.calculateHealth(this.HealthAllData.tabDailyReport[i]);
          if (this.errorMsg !== '') {
            this.errCalcCalFat = 'errors found while caculating calories and fat (' + this.errorMsg + ')';
            this.errorMsg = "";
          }
          this.HealthAllData.tabDailyReport[i].total = this.returnData.outHealthData.total;
          this.HealthAllData.tabDailyReport[i].meal = this.returnData.outHealthData.meal;
        }
      }


    this.HealthAllData.tabDailyReport.sort((a, b) => (a.date > b.date) ? -1 : 1);
    if (this.HealthAllData.fileType !== '') {
      this.HealthAllData.fileType = this.identification.fitness.fileType.Health;
    }

    this.tabNewRecordAll.splice(0, this.tabNewRecordAll.length);
    this.initTrackRecord();

    this.HealthAllData.updatedAt = strDateTime();
    // this.SpecificForm.controls['FileName'].value
    this.SaveNewRecord(this.identification.fitness.bucket, event.fileName, this.HealthAllData, 0);
    //this.updateLockFile(0);

  }

  SaveNewRecord(GoogleBucket: string, GoogleObject: string, record: any, iWait: number) {
    //var file=new File ([JSON.stringify(this.HealthAllData)],GoogleObject, {type: 'application/json'});
    var file = new File([JSON.stringify(record)], GoogleObject, { type: 'application/json' });
    if (GoogleObject === 'ConsoleLog.json') {
      const myTime = new Date();
      GoogleObject = 'ConsoleLog.json-' + myTime.toString().substring(4, 21);
      file = new File([JSON.stringify(this.myConsole)], GoogleObject, { type: 'application/json' });
    }
    if (this.identification.triggerFileSystem !== "No") {
      this.tabLock[iWait].action='updatedAt';
      this.callFileSystem=true;
    }
    this.ManageGoogleService.uploadObject(this.configServer, GoogleBucket, file, GoogleObject)
      .subscribe(res => {

        if (res.type === 4) {
          this.counterActions++
          if (iWait === 0) {
            this.actionHealth=this.counterActions;
          } else if (iWait === 1) {
            this.actionCalFat=this.counterActions;
          } else if (iWait === 5) {
            this.actionParamChart=this.counterActions;
          } else if (iWait === 6) {
            this.actionRecipe=this.counterActions;
          }
          this.tabLock[iWait].status = 0;
          this.errorMsg = 'File "' + GoogleObject + '" is successfully stored in the cloud';
        }
      },
        error_handler => {
          //**this.LogMsgConsole('Individual Record is not updated: '+ this.Table_User_Data[this.identification.id].UserId );
          this.counterActions++
          this.errorMsg = 'File' + GoogleObject + '" *** Save action failed - status is ' + error_handler.status;
          if (iWait === 0) {
            this.actionHealth=-this.counterActions;
          } else if (iWait === 1) {
            this.actionCalFat=-this.counterActions;
          } else if (iWait === 5) {
            this.actionParamChart=-this.counterActions;
          } else if (iWait === 6) {
            this.actionRecipe=-this.counterActions;
          }
        }
      )
  }

  @HostListener('window:unload', ['$event'])
  unloadHandler(event: any) {
    this.ngOnDestroy();
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: any) {
    this.ngOnDestroy();
  }
  
  ngOnDestroy() {
    this.passDestroy++
    console.log('trigger ngOnDestroy  === pass=' + this.passDestroy);
    if (this.processDestroy === false) {
      this.processDestroy = true;
      var trouve = false;
      for (var i = 0; i < this.tabLock.length && trouve === false; i++) {
        if (this.tabLock[i].lock === 1) {
          trouve = true;
          this.tabLock[0].action = 'onDestroy';
          // this.callFileSystem=true;
          this.ManageGoogleService.onFileSystem(this.configServer, this.configServer.bucketFileSystem, 'fileSystem', this.tabLock, this.iWait.toString())
          .subscribe(
            data => {
              console.log('onDestroy: return from File System' + JSON.stringify(data));
            },
            err=>{
              console.log('onDestroy: error, return from File System' + JSON.stringify(err))
            })
        }
      }
    }
  }

  waitHTTP(loop: number, max_loop: number, eventNb: number) {
    const pas = 500;
    if (loop % pas === 0) {
      console.log(eventNb + ' waitHTTP fn  ==> loop=' + loop + ' max_loop=' + max_loop);
    }
    loop++
    this.TabLoop[eventNb]++

    this.id_Animation[eventNb] = window.requestAnimationFrame(() => this.waitHTTP(loop, max_loop, eventNb));
    if (loop > max_loop || this.EventHTTPReceived[eventNb] === true || this.EventStopWaitHTTP[eventNb] === true) {
      
      console.log(eventNb + ' exit waitHTTP ==> TabLoop[eventNb]=' + this.TabLoop[eventNb] + ' eventNb=' + eventNb + ' this.EventHTTPReceived=' +
        this.EventHTTPReceived[eventNb]);
      window.cancelAnimationFrame(this.id_Animation[eventNb]);
    }
  }

  LogMsgConsole(msg: string) {
    if (this.myConsole.length > 40) {
      this.SaveNewRecord('logconsole', 'ConsoleLog.json', this.myLogConsole, -1);
    }
    this.SaveConsoleFinished = false;

    this.myLogConsole = true;
    msginLogConsole(msg, this.myConsole, this.myLogConsole, this.SaveConsoleFinished, this.HTTP_Address, this.type);
  }

}

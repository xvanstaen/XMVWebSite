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
import { configServer, LoginIdentif, msgConsole, classCredentials, classtheEvent, classCheckLock } from '../../JsonServerClass';
import { classPosDiv, getPosDiv } from '../../getPosDiv';

import { getStyleDropDownContent, getStyleDropDownBox, classDropDown } from '../../DropDownStyle'

import { ClassSubConv, ClassConv, mainClassConv, mainConvItem, ClassUnit, ConvItem } from '../../ClassConverter'

import { ClassCaloriesFat, mainClassCaloriesFat } from '../ClassHealthCalories'
import { ClassItem, DailyReport, mainDailyReport, ClassMeal, ClassDish } from '../ClassHealthCalories'

import { classConfHTMLFitHealth, classConfTableAll } from '../classConfHTMLTableAll';

import { CalcFatCalories } from '../CalcFatCalories';
import { classConfigChart, classchartHealth } from '../classConfigChart';
import { classAxis, classLegendChart, classPluginTitle, classTabFormChart, classFileParamChart } from '../classChart';
import { classFileSystem, classAccessFile, classReturnDataFS, classHeaderReturnDataFS, classRetrieveFile } from '../../classFileSystem';

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

  @Input() configServer = new configServer;
  @Input() identification = new LoginIdentif;
  @Input() tabLock: Array<classAccessFile> = [];
  @Input() triggerFunction: number = 0;
  
  @Input() credentials = new classCredentials;
  @Input() credentialsMongo = new classCredentials;
  @Input() credentialsFS = new classCredentials;
  @Output()  onTriggerSave = new EventEmitter<any>();
  openFileAccess:boolean=true;

  isRetrieveFile :boolean=false;
  iWaitToRetrieve:Array<classRetrieveFile>=[];

  resultCheckLimitHealth:number =0;
  resultCheckLimitCalFat:number=0;
  resultCheckLimitParamChart:number=0;
  resultCheckLimitRecipe:number=0;

  //returnGetRecord:any;
  returnDataFS=new classHeaderReturnDataFS;

  isCheckToLimit:boolean=false;
  //isSaveRecord:boolean=false;
  //triggerCheckToLimit:number=0;
  triggerFileSystem:number=0;

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

  returnDataFSHealth=new classHeaderReturnDataFS;
  returnDataFSCalFat=new classHeaderReturnDataFS;
  returnDataFSParamChart=new classHeaderReturnDataFS;
  returnDataFSRecipe=new classHeaderReturnDataFS;

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
  maxEventHTTPrequest: number = 12;
  id_Animation: Array<number> = [];
  TabLoop: Array<number> = [];
  NbWaitHTTP: number = 0;

  saveServer={
    google:"",
    mongo:"",
    FS:""
  }

  isconfirmSaveA:boolean=false;
  isconfirmSave:boolean=false;
  isDisplayAll:boolean=false;

  isCopyFile:boolean=false;
  isMgtCaloriesFat:boolean=false;
  //IsCalculateCalories:boolean=false;
  //isAllDataModified :boolean=false;
  isDisplayChart:boolean=false;
  isSaveCaloriesFat:boolean=false;
  //isSaveParamChart:boolean=false;
  //isSaveRecipeFile:boolean=false;
  //IsSaveConfirmedAll:boolean=false;
  //isSaveHealth:boolean=false;
  //isMustSaveFile:boolean=false;

  //recipeNameFile: string = '';
  calfatNameFile: string = '';
  errCalcCalFat:string = '';

  processDestroy: boolean = false;
  passDestroy: number = 0;

  callFileSystem:boolean=false;
  nbCallFileSystem:number=0;
  triggerReadFile:number=0;
  triggerSaveFile:number=0;

  //eventLockLimit= new classCheckLock;
  eventLockLimit= new classtheEvent;

  // used by ngChange on selected component
  healthFileRetrieved:number=0;
  recipeFileRetrieved:number=0;
  calFatFileRetrieved:number=0;
  
  // used by ngChange on health component
  createDropDownCalFat:number=0;
  calculateHeight:number=0;

  actionHealth:number=0;
  actionCalFat:number=0;
  actionRecipe:number=0;

  resultFileSystemHealth:number=0;
  resultFileSystemCalFath:number=0;
  resultFileSystemParamChart:number=0;
  resultFileSystemRecipe:number=0;

  iWait:number=0;

  // used by ngChange on paramChart component
  paramChartFileRetrieved:number=0;
  actionParamChart:number=0;

  counterActions:number=0;

  firstAccessOtherFiles:boolean=false;
 
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

  SpecificForm = new FormGroup({
    FileName: new FormControl('', { nonNullable: true }),
  })


  ngOnInit(): void {
    // used to open files in parallel using the google and mongo servers
    this.saveServer.google=this.configServer.googleServer;
    this.saveServer.mongo=this.configServer.mongoServer;
    this.saveServer.FS=this.configServer.fileSystemServer;
    for (var i = 0; i < this.maxEventHTTPrequest; i++) {
      this.EventHTTPReceived[i] = false;
      this.EventStopWaitHTTP[i] = false;
      this.TabLoop[i]=0;
    }
    this.eventLockLimit.checkLock.action="firstLoop";
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

  resultFileSystemFn(event:any){
    console.log('mainHealth - return from file-access/fileSystem event.iWait='+event.iWait);
    this.eventLockLimit.checkLock.iCheck=false;
    this.errorMsg="";
    event.nbRecall++
    if (event.iWait===0){
      this.returnDataFSHealth = event;
      this.resultCheckLimitHealth++
    } else if (event.iWait===1){
      this.returnDataFSCalFat = event;
      this.resultCheckLimitCalFat++
    } else if (event.iWait===5){
      this.returnDataFSParamChart = event;
      this.resultCheckLimitParamChart++
    }  else if (event.iWait===6){
      this.returnDataFSRecipe = event;
      //this.resultCheckLimitRecipe++
      this.resultCheckLimitCalFat++
      
    } 
  }

  callSaveFunctionHealth:number=0;
  statusSaveFnHealth:any;
  callSaveFunctionCalFat:number=0;
  statusSaveFnCalFat:any;
  //callSaveFunctionParamChart:number=0;
  statusSaveFnParamChart:any;
  //callSaveFunctionRecipe:number=0;
  statusSaveFnRecipe:any;

  resultSaveRecord(event:any){
    this.openFileAccess=false;
    if (event.iWait===0){
      if (this.actionSave==='saveCopy'){
        // reinitialise
        if (event.status===200 || event.status===0){
          this.cancelCopy();
          this.errorMsg="copy of the file has been successfully saved"
        } else {
          this.errorMsg = event.err;
        }
      } else {
        this.statusSaveFnHealth=event;
        if (this.statusSaveFnHealth.status===200 || this.statusSaveFnHealth.status===0){
          this.InHealthAllData.tabDailyReport.splice(0,this.InHealthAllData.tabDailyReport.length);
          this.InHealthAllData = FillHealthAllInOut(this.InHealthAllData,  this.HealthAllData);
          this.initTrackRecord();
        }
        this.callSaveFunctionHealth++;
      }
    } else if (event.iWait===1 || event.iWait===6){
      this.statusSaveFnCalFat=event;
      this.callSaveFunctionCalFat++;
    } else if (event.iWait===5){
      this.statusSaveFnParamChart=event;
      //this.callSaveFunctionParamChart++;
    } 
  }

  resultGetRecord(event:any){
    const iWait=event.iWait;
    this.EventStopWaitHTTP[iWait]=true;
    var noPb=true;
    if (event.status!==undefined && (event.status!==200 && event.status!==0)){
      this.errorMsg = event.err;
      noPb=false;
    } else
      if (iWait === 0) {
        console.log('file HealthAllData received');
        this.configServer.googleServer=this.saveServer.google;
        this.HealthAllData.tabDailyReport.splice(0,this.HealthAllData.tabDailyReport.length);
        this.HealthAllData = FillHealthAllInOut(this.HealthAllData, event.content);
        this.HealthAllData.tabDailyReport.sort((a, b) => (a.date > b.date) ? -1 : 1);
        if (this.HealthAllData.fileType === '') {
          this.HealthAllData.fileType = this.identification.fitness.fileType.Health;
        }
        if (this.InHealthAllData.fileType === '') {
          this.InHealthAllData.tabDailyReport.splice(0,this.InHealthAllData.tabDailyReport.length);
          this.InHealthAllData = FillHealthAllInOut(this.InHealthAllData,  this.HealthAllData);
        }
        this.initTrackRecord();
        this.SpecificForm.controls['FileName'].setValue(this.identification.fitness.files.fileHealth);
        this.healthFileRetrieved++
        //****************** iWait === 1 *************************/
      } else if (iWait === 1) {
        this.ConfigCaloriesFat.tabCaloriesFat.splice(0, this.ConfigCaloriesFat.tabCaloriesFat.length)
        if (event.content.fileType !== '') {
          this.ConfigCaloriesFat.fileType = event.content.fileType;
        } else {
          this.ConfigCaloriesFat.fileType = this.identification.fitness.fileType.FitnessMyConfig;
        }
        if (event.content.updatedAt !== undefined) {
          this.ConfigCaloriesFat.updatedAt = event.content.updatedAt;
        } else {
          this.ConfigCaloriesFat.updatedAt = '';
        }
        this.ConfigCaloriesFat.tabCaloriesFat = event.content.tabCaloriesFat;
        this.calFatFileRetrieved++
        //this.CreateDropDownCalFat();
        this.createDropDownCalFat++
        //****************** iWait === 2 *************************/
      } else if (iWait === 2) {
        this.ConvertUnit.tabConv.splice(0, this.ConvertUnit.tabConv.length);
        this.ConvertUnit = event.content;
        if (event.content.fileType !== '') {
          this.ConvertUnit.fileType = event.content.fileType
        } else {
          this.ConvertUnit.fileType = this.identification.configFitness.fileType.convertUnit;
        }
        if (event.content.updatedAt !== undefined) {
          this.ConvertUnit.updatedAt = event.content.updatedAt;
        } else {
          this.ConvertUnit.updatedAt = '';
        }
        this.ConvertUnit.tabConv = event.content.tabConv;
      }
      //****************** iWait === 3 *************************/
      else if (iWait === 3) {
        //this.ConfigHTMLFitHealth=data;
        this.ConfigHTMLFitHealth.fileType == event.content.fileType;
        this.ConfigHTMLFitHealth.debugPhone == event.content.debugPhone;
        this.ConfigHTMLFitHealth.ConfigHealth.fileType == event.content.ConfigHealth.fileType;
        if (event.content.ConfigHealth.updatedAt !== undefined) {
          this.ConfigHTMLFitHealth.ConfigHealth.updatedAt == event.content.ConfigHealth.updatedAt;
        } else {
          this.ConfigHTMLFitHealth.ConfigHealth.updatedAt = '';
        }
        this.ConfigHTMLFitHealth.ConfigHealth.confTableAll = event.content.ConfigHealth.confTableAll;

        this.ConfigHTMLFitHealth.ConfigCalFat.fileType == event.content.ConfigCalFat.fileType;
        if (event.content.ConfigCalFat.updatedAt !== undefined) {
          this.ConfigHTMLFitHealth.ConfigCalFat.updatedAt == event.content.ConfigCalFat.updatedAt;
        } else {
          this.ConfigHTMLFitHealth.ConfigCalFat.updatedAt = '';
        }
        this.ConfigHTMLFitHealth.ConfigCalFat.confCaloriesFat = event.content.ConfigCalFat.confCaloriesFat;

        this.confTableAll = this.ConfigHTMLFitHealth.ConfigHealth.confTableAll;
        //this.calculateHeight();
        this.calculateHeight++
      //****************** iWait === 4 *************************/
      } else if (iWait === 4) {
        this.configServer.googleServer=this.saveServer.google;

        this.ConfigChart.fileType = event.content.fileType;
        if (event.content.updatedAt !== undefined) {
          this.ConfigChart.updatedAt = event.content.updatedAt;
        } else {
          this.ConfigChart.updatedAt = '';
        }
        this.ConfigChart.chartHealth = event.content.chartHealth;
      }
      //****************** iWait === 5 *************************/
      else if (iWait === 5) {
        this.fileParamChart.fileType = event.content.fileType;
        if (event.content.updatedAt !== undefined) {
          this.fileParamChart.updatedAt = event.content.updatedAt;
        } else {
          this.fileParamChart.updatedAt = '';
        }
        this.fileParamChart.data = event.content.data;
      //****************** iWait === 6 *************************/   
      } else if (iWait === 6) {
        this.fileRecipe.fileType = event.content.fileType;
        if (event.content.updatedAt !== undefined) {
          this.fileRecipe.updatedAt = event.content.updatedAt;
        } else {
          this.fileRecipe.updatedAt = '';
        }
        this.fileRecipe.tabCaloriesFat = event.content.tabCaloriesFat;
        this.recipeFileRetrieved++
        //****************** iWait === 7 ** SHOULD IT BE DELETED - SEEMS TO BE OLD CODE ***********************/
      } else if (iWait === 10) { 
        this.convToDisplay=event.content;
      }
      if (noPb===true){
          console.log('getRecord - data processed for iWait='+iWait + '  EventHTTPReceived=true');
          this.EventHTTPReceived[iWait] = true;

          if (this.triggerCalculateCalFat===true && this.EventHTTPReceived[0]===true && 
                this.EventHTTPReceived[1]===true && this.EventHTTPReceived[2]===true ){
            this.processCalculateCalFat();
          }
      } 
  }

  processCalculateCalFat(){
    this.errCalcCalFat = '';
    this.triggerCalculateCalFat=false;
    for (var j = 0; j < this.HealthAllData.tabDailyReport.length; j++) {
      this.calculateHealth(this.HealthAllData.tabDailyReport[j]);
      if (this.errorMsg !== '') {
        this.errCalcCalFat = 'errors found while caculating calories and fat';
      }
      this.HealthAllData.tabDailyReport[j].total = this.returnData.outHealthData.total;
      this.HealthAllData.tabDailyReport[j].meal = this.returnData.outHealthData.meal;
    }
    this.initTrackRecord();
    this.errorMsg = "calculatoin of calories and fat is completed; " + this.errorMsg;
    this.TheSelectDisplays.controls['CalculCalories'].setValue('N');
  }

  unlockFile(iWait:number){
    this.tabLock[iWait].action="unlock";
    this.triggerFileSystem++;
  }
  
  SelectDisplay() {
    this.errorMsg="";
    if (this.TheSelectDisplays.controls['DisplayAll'].value === 'Y') {
      this.isDisplayAll = true;
    } else {
      this.isDisplayAll = false;
    }
  }

  triggerCalculateCalFat:boolean=false;
  SelRadio(event: any) {
    // this.checkLockLimit(0);
    var iK=0;
    if (this.openFileAccess===false){
      this.openFileAccess=true;
    }
    this.callFileSystem=false;
    this.iWaitToRetrieve.splice(0,this.iWaitToRetrieve.length);
    this.errorMsg="";
    const i = event.substring(2);
    const NoYes = event.substring(0, 1);
    if (i === '3') {
      if (NoYes === 'Y') {
        this.isDisplayAll = true;
        if (this.tabLock[0].lock !== 1) {
          this.tabLock[0].action='lock';
          this.iWait=0;
          const theClass=new classRetrieveFile;
          this.iWaitToRetrieve.push(theClass);
          this.iWaitToRetrieve[0].iWait=0;
          this.iWaitToRetrieve[0].accessFS=true;
          iK=1;
        } else {
          iK = 0;
        }
        for (iJ=iK; iJ<4; iJ++){
          const theClass=new classRetrieveFile;
          this.iWaitToRetrieve.push(theClass);
        }
        iK--;
        if (this.EventHTTPReceived[1]===false){
            iK++;
            this.iWaitToRetrieve[iK].iWait=1;
            this.iWaitToRetrieve[iK].accessFS=false;
        } else {
            this.iWaitToRetrieve.splice(iK+1,1);
        }
        if (this.EventHTTPReceived[3]===false){
            iK++;
            this.iWaitToRetrieve[iK].iWait=3;
            this.iWaitToRetrieve[iK].accessFS=false;
        } else {
            this.iWaitToRetrieve.splice(iK+1,1);
        }         
        if (this.EventHTTPReceived[2]===false){
          iK++;
          this.iWaitToRetrieve[iK].iWait=2;
          this.iWaitToRetrieve[iK].accessFS=false;
        } else {
            this.iWaitToRetrieve.splice(iK+1,1);
        }       
        if (this.iWaitToRetrieve.length>0){
          this.triggerReadFile++;
        }
      } else {
        if (this.tabLock[0].lock === 1) {
          this.tabLock[0].action='unlock';
          this.iWait=0;
          const theClass=new classRetrieveFile;
          this.iWaitToRetrieve.push(theClass);
          this.iWaitToRetrieve[0].iWait=0;
          this.iWaitToRetrieve[0].accessFS=true;
          this.triggerFileSystem++;
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
          this.EventHTTPReceived[1]=false;
          this.tabLock[1].action='lock';
          this.iWait=1;
          const theClass=new classRetrieveFile;
          this.iWaitToRetrieve.push(theClass);
          this.iWaitToRetrieve[0].iWait=1;
          this.iWaitToRetrieve[0].accessFS=true;
          iK=1;
        } else {
          iK = 0;
        }
        for (var iJ=iK; iJ<4; iJ++){
            const theClass=new classRetrieveFile;
            this.iWaitToRetrieve.push(theClass);
        }
        iK--
        if (this.EventHTTPReceived[3]===false){
            iK++;
            this.iWaitToRetrieve[iK].iWait=3;
            this.iWaitToRetrieve[iK].accessFS=false;
        } else {
            this.iWaitToRetrieve.splice(iK+1,1);
        }
        if (this.EventHTTPReceived[6]===false){
            iK++;
            this.iWaitToRetrieve[iK].iWait=6;
            this.iWaitToRetrieve[iK].accessFS=false;
        } else {
            this.iWaitToRetrieve.splice(iK+1,1);
        }
        if (this.EventHTTPReceived[2]===false){
          iK++;
          this.iWaitToRetrieve[iK].iWait=2;
          this.iWaitToRetrieve[iK].accessFS=false;
        } else {
            this.iWaitToRetrieve.splice(iK+1,1);
        } 
        if (this.iWaitToRetrieve.length>0){
          this.triggerReadFile++;
        }

      } else {
        this.isMgtCaloriesFat = false;
        if (this.tabLock[1].lock === 1) {
          this.tabLock[1].action='unlock';
          this.tabLock[6].action='unlock';
          this.iWait=1;
          const theClass=new classRetrieveFile;
          this.iWaitToRetrieve.push(theClass);
          this.iWaitToRetrieve[0].iWait=1;
          this.iWaitToRetrieve[0].accessFS=true;
          iK=+1;
        } else {
          iK=+0;
        }
        for (var iJ=iK; iJ<3; iJ++){
            const theClass=new classRetrieveFile;
            this.iWaitToRetrieve.push(theClass);
        }
        iK--  
        if (this.EventHTTPReceived[6]===false){
            iK++;
            this.iWaitToRetrieve[iK].iWait=6;
            this.iWaitToRetrieve[iK].accessFS=false;
        } else {
            this.iWaitToRetrieve.splice(iK+1,1);
        }
        if (this.iWaitToRetrieve.length>0){
            this.triggerReadFile++;
        }
      }
    } else if (i === '6') { // Calculate Calories & Fat
      if (NoYes === 'Y') {
        iK=0;
        if (this.tabLock[0].lock !== 1) {
          this.EventHTTPReceived[0]=false;
          this.tabLock[0].action='lock';
          this.iWait=0;
          const theClass=new classRetrieveFile;
          this.iWaitToRetrieve.push(theClass);
          this.iWaitToRetrieve[0].iWait=0;
          this.iWaitToRetrieve[0].accessFS=true;
          iK=1;
        }
        for (var iJ=iK; iJ<3; iJ++){
            const theClass=new classRetrieveFile;
            this.iWaitToRetrieve.push(theClass);
        }
        iK--
        if (this.EventHTTPReceived[1]===false){
            iK++;
            this.iWaitToRetrieve[iK].iWait=1;
            this.iWaitToRetrieve[iK].accessFS=false;
        } else {
            this.iWaitToRetrieve.splice(iK+1,1);
        }
        if (this.EventHTTPReceived[2]===false){
            iK++;
            this.iWaitToRetrieve[iK].iWait=2;
            this.iWaitToRetrieve[iK].accessFS=false;
        } else {
            this.iWaitToRetrieve.splice(iK+1,1);
        }
        if (this.iWaitToRetrieve.length>0){
          this.triggerReadFile++;
          this.triggerCalculateCalFat=true;
        } else { // all files have already been retrieved and have the right status
          this.triggerFileSystem++; 
          this.processCalculateCalFat();
        }
      } else { // just to be safe
        this.triggerCalculateCalFat=true;
      }
    } else if (i === '8') {
      if (NoYes === 'Y') { // HTML file reload file
        this.iWait=3;
        if (this.EventHTTPReceived[3]===false){
          const theClass=new classRetrieveFile;
          this.iWaitToRetrieve.push(theClass);
          this.iWaitToRetrieve[0].iWait=3;
          this.iWaitToRetrieve[0].accessFS=false;
          this.triggerReadFile++;
        }
      } 
    } else if (i === '7') { // Display chart
      if (NoYes === 'Y') {
        this.isDisplayChart = true;
        if (this.tabLock[5].lock !== 1|| this.fileParamChart.data.length===0) {
          this.EventHTTPReceived[5]=false;
          this.tabLock[5].action='lock';
          this.iWait=5;
          const theClass=new classRetrieveFile;
          this.iWaitToRetrieve.push(theClass);
          this.iWaitToRetrieve[0].iWait=5;
          this.iWaitToRetrieve[0].accessFS=true;
          iK=1;
        } else {
          iK=0;
        }
        for (var iJ=iK; iJ<3; iJ++){
          const theClass=new classRetrieveFile;
          this.iWaitToRetrieve.push(theClass);
        }
        iK--
        if (this.EventHTTPReceived[0]===false){
            iK++;
            this.iWaitToRetrieve[iK].iWait=0;
            this.iWaitToRetrieve[iK].accessFS=false;
        } else {
            this.iWaitToRetrieve.splice(iK+1,1);
        }
        if (this.EventHTTPReceived[4]===false){
            iK++;
            this.iWaitToRetrieve[iK].iWait=4;
            this.iWaitToRetrieve[iK].accessFS=false;
        } else {
            this.iWaitToRetrieve.splice(iK+1,1);
        }
        if (this.iWaitToRetrieve.length>0){
          this.triggerReadFile++;
        }
      } else {
        this.isDisplayChart = false;
        if (this.tabLock[5].lock === 1) {
          this.tabLock[5].action='unlock';
          this.iWait=5;
          const theClass=new classRetrieveFile;
          this.iWaitToRetrieve.push(theClass);
          this.iWaitToRetrieve[0].iWait=5;
          this.iWaitToRetrieve[0].accessFS=true;
          this.triggerFileSystem++;
        }
      }
    } else if (i === '9') {
      if (NoYes === 'Y') { // reload configuration chart
          this.tabLock[4].action='';
          this.iWait=4;
          const theClass=new classRetrieveFile;
          this.iWaitToRetrieve.push(theClass);
          this.iWaitToRetrieve[0].iWait=4;
          this.iWaitToRetrieve[0].accessFS=false;
          this.triggerReadFile++;
      }
    }
  }

  calculateHealth(selRecord: DailyReport) {
    this.returnData = CalcFatCalories(this.ConfigCaloriesFat, selRecord, this.ConvertUnit);
    if (this.returnData.error > 0) {
      this.errorMsg = this.returnData.error + ' nb of errors detected';
    }
  }

  checkLockLimitFn(event:any) {
    this.openFileAccess=true;
    const saveNbCalls=this.eventLockLimit.nbCalls;
    if (event.bucket===undefined){
      this.eventLockLimit.checkLock = event;

    } else {
      this.eventLockLimit = event;
    }
    this.eventLockLimit.iWait=this.eventLockLimit.checkLock.iWait;
    this.eventLockLimit.nbCalls=saveNbCalls+1;
    this.isRetrieveFile=true;
  }

  retrieveRecord(event:any){
    this.openFileAccess=true;
    this.iWaitToRetrieve.splice(0,this.iWaitToRetrieve.length);
    const theClass=new classRetrieveFile;
    this.iWaitToRetrieve.push(theClass);
    this.iWait=event;
    this.tabLock[this.iWait].action='check&update';
    this.iWaitToRetrieve[0].iWait=this.iWait;
    if (this.iWait==0 || this.iWait===3){
      this.iWaitToRetrieve[0].accessFS=true;
    } else {
      this.iWaitToRetrieve[0].accessFS=false;
    }
    this.triggerFileSystem++
    this.isRetrieveFile = true;
    this.triggerReadFile++
  }

  initTrackRecord() {
    this.tabNewRecordAll.splice(0, this.tabNewRecordAll.length);
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

  saveParamChart(event:any){
    
    this.openFileAccess=true;
    this.errorMsg="";
    this.fileParamChart.fileType = this.identification.fitness.fileType.myChart;
    this.fileParamChart.updatedAt = strDateTime();
    event.iWait=5;
    event.bucket=this.identification.fitness.bucket;
    if (event.fileName!==""){
      event.object=event.fileName;
    } else {
      event.object=this.identification.fitness.files.myChartConfig;
    }
    event.fileContent=this.fileParamChart;
    event.checkLock.iCheck=true;
    event.saveCalls++
    this.checkLockLimitFn(event);
  }

  SaveCaloriesFat(event: any) {
    this.openFileAccess=true;
    this.errorMsg="";
    this.isSaveCaloriesFat = true;
    //if (event.fileType === undefined) {
    //  this.calfatNameFile = event;
    //}
    if (event.target.id==='RecipeSave'){
      this.processSaveRecipe(event);
    } else {
      this.processSaveCaloriesFat(event);
    }
    event.checkLock.iCheck=true;
    event.saveCalls++
    this.checkLockLimitFn(event);
  }

  processSaveCaloriesFat(event: any) {
      if (this.ConfigCaloriesFat.fileType === '') {
        this.ConfigCaloriesFat.fileType = this.identification.configFitness.fileType.calories;
      }
      this.ConfigCaloriesFat.updatedAt = strDateTime();
      event.bucket=this.identification.configFitness.bucket;
      event.object=event.fileName;
      event.fileContent=this.ConfigCaloriesFat;
      event.iWait=1;
  }

  processSaveRecipe(event: any) {
      if (this.fileRecipe.fileType === '') {
        this.fileRecipe.fileType = this.identification.fitness.fileType.recipe;
      }
      this.fileRecipe.updatedAt = strDateTime();
      event.bucket=this.identification.fitness.bucket;
      event.object=event.fileName;
      event.fileContent=this.fileRecipe;
      event.iWait=6;
  }

  confirmSaveAction:boolean=false;

  confirmSave(event: any) {
    if (this.tabLock[event.checkLock.iWait].lock === 1) {
      this.confirmSaveAction = true;
      this.eventLockLimit.checkLock.iWait=event.checkLock.iWait;
      this.eventLockLimit.checkLock.isDataModified=event.checkLock.isDataModified;
      this.eventLockLimit.checkLock.isSaveFile=event.checkLock.isSaveFile;
      this.eventLockLimit.checkLock.lastInputAt=event.lastInput;
      this.eventLockLimit.checkLock.iCheck=true;
      this.eventLockLimit.nbCalls++
      this.isCheckToLimit=true;
      this.confirmSaveAction = false;
    } 
  }

  actionSave:string="";
  saveCopy() {
    this.actionSave='saveCopy';
    this.HealthAllData.tabDailyReport.sort((a, b) => (a.date > b.date) ? -1 : 1);
    if (this.HealthAllData.fileType !== '') {
      this.HealthAllData.fileType = this.identification.fitness.fileType.Health;
    }
    this.HealthAllData.updatedAt = strDateTime();
    this.eventLockLimit.bucket=this.identification.fitness.bucket;
    this.eventLockLimit.object=this.SpecificForm.controls["FileName"].value;
    this.eventLockLimit.fileContent=this.HealthAllData;
    this.eventLockLimit.iWait=0;
    this.triggerSaveFile++
  }

  cancelCopy() {
    this.actionSave='';
    this.errorMsg="";
    this.isCopyFile = false;
    this.TheSelectDisplays.controls['CopyFile'].setValue('N');
  }

  cancelUpdates(iWait:number){
    this.errorMsg="";
    if (iWait === 0) {
      this.HealthAllData.tabDailyReport.splice(0, this.HealthAllData.tabDailyReport.length)
      this.HealthAllData = FillHealthAllInOut(this.HealthAllData, this.InHealthAllData);
      this.initTrackRecord();
      //this.IsSaveConfirmedAll = false;
    } 
    this.counterActions++;
    this.actionHealth++;
  }

  processSaveHealth(event: any) {
    this.errorMsg = '';
    this.errCalcCalFat = '';
    var trouve = false;
    var i = 0
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
    this.HealthAllData.updatedAt = strDateTime();
    event.bucket=this.identification.fitness.bucket;
    event.object=event.fileName;
    event.fileContent=this.HealthAllData;
    event.iWait=0;

    event.saveCalls++
    this.triggerSaveFile++
    this.checkLockLimitFn(event);
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
      for (var i=0; i<this.tabLock.length; i++){
        if (this.tabLock[i].action!==''){
          this.tabLock[i].lock = 1;
        }
      }
      for (var i = 0; i < this.tabLock.length && trouve === false; i++) {
        if (this.tabLock[i].lock === 1) {
          trouve = true;
          this.tabLock[0].action = 'onDestroy';
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
      for (var i=0; i<this.tabLock.length; i++){
        this.tabLock[i].lock = 3;
        this.tabLock[i].action = "";
      }
    }
  }


  LogMsgConsole(msg: string) {
    if (this.myConsole.length > 40) {
      //this.SaveNewRecord('logconsole', 'ConsoleLog.json', this.myLogConsole, -1);
    }
    this.SaveConsoleFinished = false;

    this.myLogConsole = true;
    msginLogConsole(msg, this.myConsole, this.myLogConsole, this.SaveConsoleFinished, this.HTTP_Address, this.type);
  }


  ngOnChanges(changes: SimpleChanges) {
    console.log('ngOnChange main-health');
    for (const propName in changes) {
      const j = changes[propName];
      if (propName === 'theTriggerSaveFile' && changes[propName].firstChange === false) {
        console.log('xxx');
        this.saveParamChart(this.eventLockLimit);

      } 
    }
  }


}

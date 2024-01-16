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
import { configServer, LoginIdentif, msgConsole, classCredentials } from '../../JsonServerClass';
import { classPosDiv, getPosDiv } from '../../getPosDiv';

import { environment } from 'src/environments/environment';
import { manage_input } from '../../manageinput';
import { eventoutput, thedateformat } from '../../apt_code_name';

import { getStyleDropDownContent, getStyleDropDownBox, classDropDown } from '../../DropDownStyle'

import { ClassSubConv, ClassConv, mainClassConv, ClassUnit, ConvItem } from '../../ClassConverter'

import { ClassCaloriesFat, mainClassCaloriesFat } from '../ClassHealthCalories'
import { ClassItem, DailyReport, mainDailyReport, ClassMeal, ClassDish } from '../ClassHealthCalories'

import { classConfHTMLFitHealth, classConfTableAll } from '../classConfHTMLTableAll';

import { CalcFatCalories } from '../CalcFatCalories';
import { classConfigChart, classchartHealth } from '../classConfigChart';
import { classAxis, classLegendChart, classPluginTitle, classTabFormChart, classFileParamChart } from '../classChart';
import { classFileSystem, classAccessFile } from '../../classFileSystem';

import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { AccessConfigService } from 'src/app/CloudServices/access-config.service';

import { fnAddTime, convertDate, strDateTime, fnCheckLockLimit, findIds } from '../../MyStdFunctions';

@Component({
  selector: 'app-health',
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.css']
})
export class HealthComponent implements OnInit {

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

  InHealthAllData = new mainDailyReport;
  InConfigCaloriesFat = new mainClassCaloriesFat;
  InConvertUnit = new mainClassConv;
  InConfigHTMLFitHealth = new classConfHTMLFitHealth;
  InConfigChart = new classConfigChart;
  InFileParamChart = new classFileParamChart;


  fileParamChart = new classFileParamChart;
  ConfigChart = new classConfigChart;
  ConvertUnit = new mainClassConv;
  HealthData = new mainDailyReport;;   // to create a new record
  HealthAllData = new mainDailyReport; // contain the full object
  SelectedRecord = new DailyReport;
  ConfigCaloriesFat = new mainClassCaloriesFat;
  fileRecipe = new mainClassCaloriesFat;

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
  message: string = '';
  error_msg: string = '';

  EventHTTPReceived: Array<boolean> = [];
  maxEventHTTPrequest: number = 20;
  id_Animation: Array<number> = [];
  TabLoop: Array<number> = [];
  NbWaitHTTP: number = 0;


  SpecificForm = new FormGroup({
    FileName: new FormControl('', { nonNullable: true }),
  })

  IsSaveConfirmedCre: boolean = false;
  IsSaveConfirmedSel: boolean = false;
  isCreateNew: boolean = false;
  isDisplaySpecific: boolean = false;
  isDisplayAll: boolean = false;
  isCopyFile: boolean = false;
  isMgtCaloriesFat: boolean = false;
  isSelectedDateFound: boolean = false;
  isDeleteConfirmed: boolean = false;
  isAllDataModified: boolean = false;
  IsSaveConfirmedAll: boolean = false;
  IsCalculateCalories: boolean = false;
  isDisplayChart: boolean = false;
  isInputFood: boolean = false;
  strInputFood: string = "";

  isForceReset: boolean = false;

  errorFn: string = '';
  SelectedRecordNb: number = -1;
  recordToDelete: number = 0;

  TheSelectDisplays: FormGroup = new FormGroup({
    CreateNew: new FormControl('N', { nonNullable: true }),
    DisplaySpecific: new FormControl('N', { nonNullable: true }),
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


  TabAction: Array<any> = [{ name: '' }];
  NewTabAction: Array<any> = [{ type: '', name: '' }];

  // CONVERSION OF UNITS IF NEEDED

  ConvToDisplay: Array<ConvItem> = []
  theTabOfUnits: Array<ClassUnit> = [];

  ValuesToConvert = {
    valueFromTo: 0,
    From: '',
    To: '',
    valueFrom: 0,
    valueTo: 0,
    type: '',
  }

  theEvent = {
    target: {
      id: '',
      textContent: '',
      value: ''
    },
    currentTarget: {
      id: '',
      textContent: '',
      value: ''
    }
  }

  TabOfId: Array<any> = [];

  dateRangeStart = new Date();
  dateRangeEnd = new Date();
  dateRangeStartHealth = new Date();
  dateRangeEndHealth = new Date();

  getScreenWidth: any;
  getScreenHeight: any;
  device_type: string = '';

  /****  CONFIGURATION PARAMETERS FOR HTML *****/
  confTableAll = new classConfTableAll;

  ConfigHTMLFitHealth = new classConfHTMLFitHealth;

  filterCalc: boolean = false;
  filterHealth: boolean = false;
  searchOneDate: number = 0;
  searchOneDateHealth: number = 0;
  isRangeDateError: boolean = false;

  isDeleteItem: boolean = false;
  prevDialogue: number = 0;
  dialogue: Array<boolean> = [false, false, false, false, false, false, false]; // CREdate=0; CREmeal=1; CREingr=2; SELdate=3; SELmeal=4; SELingr=5; allData=6

  myAction: string = '';
  myType: string = '';
  tabNewRecordAll: Array<any> = [
    {
      nb: 0,
      meal: [{
        nb: 0,
        food: [{ nb: 0, }]
      }]
    }
  ];

  returnData = {
    error: 0,
    outHealthData: new DailyReport
  }

  tabMeal: Array<any> = [{ name: '' }];
  tabFood: Array<any> = [{ name: '' }];
  tabInputMeal: Array<any> = [];
  tabInputFood: Array<any> = [];
  //selType:string='';
  //selFood:string='';

  // Dropdown box dimension

  sizeBox = new classDropDown;

  styleBox: any;
  styleBoxOption: any;
  styleBoxMeal: any;
  styleBoxOptionMeal: any;
  styleBoxFood: any;
  styleBoxOptionFood: any;

  sizeBoxContentMeal: number = 0;
  sizeBoxMeal: number = 0;
  sizeBoxContentFood: number = 0;
  sizeBoxFood: number = 0;

  mousedown: boolean = false;
  selectedPosition = {
    x: 0,
    y: 0
  };

  posDivCalFat = new classPosDiv;
  posDivReportHealth = new classPosDiv;
  posDivAfterTitle = new classPosDiv;

  inData = new classAccessFile;
  tabLock: Array<classAccessFile> = []; //0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked;

  titleHeight: number = 0;
  posItem: number = 0;
  eventClientY: number = 0;

  saveServer={
    google:"",
    mongo:"",
    FS:""
  }

  /*
  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    //this.selectedPosition = { x: event.pageX, y: event.pageY };
    //this.getPosDivAfterTitle();
    this.posDivAfterTitle = getPosDiv("posAfterTitle");
    this.eventClientY = event.clientY;
  }
  */

  actionMouseUp(event:any){
    this.posDivAfterTitle = getPosDiv("posAfterTitle");
    this.eventClientY = event.clientY;
  }

  foodPos: number = 0;
  findPosItem(sizeBox: any) {
    this.foodPos = Math.trunc(Number(this.eventClientY) - Number(this.posDivAfterTitle.ClientRect.Top) - Number(this.titleHeight)) ;
    this.posItem =  this.foodPos - Number(sizeBox) / 2 + 10;
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
  }

  maxItemsPerPage:number=30;
  numPage:number=1;
  displayHealthAllData = new mainDailyReport;
  minNum:number=0;
  maxNum:number=0;

  manageDisplayAll(){
    var iOut = -1;
    for (var i= (this.numPage-1) * this.maxItemsPerPage; i< this.HealthAllData.tabDailyReport.length; i++){
        iOut++
        this.fillHealthOneDay(this.displayHealthAllData, this.HealthAllData, i, iOut);
    }

  }

  pageNext(){
    if (this.maxItemsPerPage * this.numPage < this.HealthAllData.tabDailyReport.length){
      this.numPage ++
    }
    this.minNum = (this.numPage-1) * this.maxItemsPerPage + 1;
    this.maxNum = this.minNum + this.maxItemsPerPage;
  }

  pagePrev(){
    if (this.numPage > 1){
      this.numPage --
    }
    this.minNum = (this.numPage-1) * this.maxItemsPerPage ;
    this.maxNum = this.minNum + this.maxItemsPerPage;
  }


  ngOnInit(): void {

    // used to open files in parallel using the google and mongo servers
    this.saveServer.google=this.configServer.googleServer;
    this.saveServer.mongo=this.configServer.mongoServer;
    this.saveServer.FS=this.configServer.fileSystemServer;

    this.minNum = 0 ;
    this.maxNum = this.maxItemsPerPage;

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
      this.tabLock[i].userServerId = this.identification.userServerId;
      // this.tabLock[i].credentialDate = this.identification.credentialDate;

      // to be used to access FileSystem
      this.tabLock[i].credentialDate = this.credentialsFS.creationDate;
    }

    this.tabLock[0].objectName = this.identification.fitness.files.fileHealth + this.identification.UserId;
    this.tabLock[1].objectName = this.identification.configFitness.files.calories;
    this.tabLock[5].objectName = this.identification.fitness.files.myChartConfig + this.identification.UserId;;


    for (var i = 0; i < this.maxEventHTTPrequest; i++) {
      this.EventHTTPReceived[i] = false;
      this.TabLoop[i]=0;
    }

    if (this.InHealthAllData.fileType === '') {
      this.GetRecord(this.identification.fitness.bucket, this.identification.fitness.files.fileHealth, 0);
    } else {
      this.FillHealthAllInOut(this.HealthAllData, this.InHealthAllData);
      this.initTrackRecord();
      this.EventHTTPReceived[0] = true;
      this.SpecificForm.controls['FileName'].setValue(this.identification.fitness.files.fileHealth);
    }

    if (this.InConfigHTMLFitHealth.fileType === '') {
      this.GetRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.confHTML, 3);

    } else {
      this.ConfigHTMLFitHealth = this.InConfigHTMLFitHealth;
      this.confTableAll = this.InConfigHTMLFitHealth.ConfigHealth.confTableAll;
      this.EventHTTPReceived[3] = true;
      this.calculateHeight();
    }

    this.posDivCalFat = getPosDiv("posTopAppCalFat");
    this.posDivAfterTitle = getPosDiv("posTopAppReportHealth");
    this.posDivAfterTitle = getPosDiv("posAfterTitle");
    this.sizeBox.widthContent = 0;
    this.sizeBox.widthOptions = 220;
    this.sizeBox.heightItem = 25;
    this.sizeBox.maxHeightContent = 275;
    this.sizeBox.maxHeightOptions = 275;
    this.sizeBox.scrollY = 'hidden';

    this.SpecificForm.controls['FileName'].setValue('');
    this.tabMeal[0].name = 'Breakfast';
    this.tabMeal.push({ name: '' });
    this.tabMeal[1].name = 'Lunch';
    this.tabMeal.push({ name: '' });
    this.tabMeal[2].name = 'Dinner';
    this.tabMeal.push({ name: '' });
    this.tabMeal[3].name = 'Snack';
    var i = 0;
    for (i = 0; i < 3; i++) {
      this.TabOfId[i] = 0;
    }
    this.TabAction[0].name = 'cancel';
    const A = { name: 'A' };
    this.TabAction.push(A);
    this.TabAction[1].name = 'insert before';
    const B = { name: 'A' };
    this.TabAction.push(B);
    this.TabAction[2].name = 'insert after';
    const C = { name: 'A' };
    this.TabAction.push(C);
    this.TabAction[3].name = 'delete';
    const tabItems = ['date', 'meal', 'food'];

    this.NewTabAction[0].type = '';
    this.NewTabAction[0].name = 'cancel';
    var k = 0;
    for (i = 0; i < tabItems.length; i++) {
      for (var j = 0; j < 3; j++) {
        k++;
        const D = { type: 'a', name: 'A' };
        this.NewTabAction.push(D);
        this.NewTabAction[k].type = tabItems[i];
        this.NewTabAction[k].name = this.TabAction[j + 1].name;
      }
    }

    for (var i = 0; i < this.dialogue.length; i++) {
      this.dialogue[i] = false;
    }
    this.searchOneDateHealth = 0;
    this.theEvent.target.id = 'New';
    this.CreateDay(this.theEvent);

    this.tabLock[0].bucket = this.identification.fitness.bucket;
    this.tabLock[0].object = this.identification.fitness.files.fileHealth;


    this.tabLock[1].bucket = this.identification.configFitness.bucket;
    this.tabLock[1].object = this.identification.configFitness.files.calories;

    this.tabLock[2].bucket = this.identification.configFitness.bucket;
    this.tabLock[2].object = this.identification.configFitness.files.convertUnit;

    this.tabLock[4].bucket = this.identification.configFitness.bucket;
    this.tabLock[4].object = this.identification.configFitness.files.confChart;

    this.tabLock[5].bucket = this.identification.configFitness.bucket;
    this.tabLock[5].object = this.identification.fitness.files.myChartConfig;


    this.tabLock[6].bucket = this.identification.configFitness.bucket;
    this.tabLock[6].object = this.identification.fitness.files.recipe;

    this.tabLock[3].bucket = this.identification.configFitness.bucket;
    this.tabLock[3].object = this.identification.configFitness.files.confHTML;

    // TO BE REVIEWED IN ORDER TO READ, MODIFY ONLINE AND SAVE
    //this.ConfigHTMLFitness.tabConfig[0].confTableAll=this.confTableAll;
    //this.SaveNewRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.confHTML, this.ConfigHTMLFitness);

    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
    this.device_type = navigator.userAgent;
    this.device_type = this.device_type.substring(10, 48);
    this.HTTP_Address = this.Google_Bucket_Access_RootPOST + "logconsole/o?name=";
    this.SelectDisplay();
    const theDate = new Date;
    this.TheSelectDisplays.controls['startRange'].setValue('');
    this.TheSelectDisplays.controls['endRange'].setValue('');

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
  }

  accessAllOtherFiles() {

    if (this.InConfigCaloriesFat.fileType !== '') {
      this.ConfigCaloriesFat = this.InConfigCaloriesFat;
      this.EventHTTPReceived[1] = true;
      this.CreateDropDownCalFat();
    } else {
      this.GetRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.calories, 1);
    }

    if (this.fileRecipe.fileType === '') {
      this.GetRecord(this.identification.fitness.bucket, this.identification.fitness.files.recipe, 6);
    }

    if (this.InConvertUnit.fileType === '') {
      this.GetRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.convertUnit, 2);
    } else {
      this.ConvertUnit = this.InConvertUnit;
      this.EventHTTPReceived[2] = true;
    }
  }


  resetBooleans() {
    //this.isCopyFile=false;
    //this.isSelectedDateFound=false;
    this.isDeleteItem = false;
    this.dialogue[this.prevDialogue] = false;
    this.tabInputMeal.splice(0, this.tabInputMeal.length);
    this.isInputFood = false;
    //this.tabInputFood.splice(0,this.tabInputFood.length);
    if (this.tabLock[0].lock !== 1 || this.isForceReset === true) {
      this.isDeleteConfirmed = false;
      this.isDisplaySpecific = false;
      this.IsSaveConfirmedCre = false;
      this.IsSaveConfirmedSel = false;
      this.isCreateNew = false;
      this.IsSaveConfirmedAll = false;
      this.isAllDataModified = false;
      this.tabNewRecordAll.splice(0, this.tabNewRecordAll.length);
      this.initTrackRecord();

      this.isMustSaveFile = false;
      this.isSaveHealth = false;
      this.isForceReset = false;
    }

  }

  calculateHeight() {
    var i = 0;
    i = this.confTableAll.title.height.indexOf('px');
    this.titleHeight = Number(this.confTableAll.title.height.substring(0, i));
  }

  checkText: string = '';
  SearchText(event: any) {
    this.resetBooleans();
    if (event.currentTarget.id === 'search' && event.currentTarget.value !== '') {
      this.checkText = event.currentTarget.value.toLowerCase().trim();
    } else {
      this.checkText = '';
    }
  }

  actionSearchText(event: any) {
    this.resetBooleans();
    if (event.target.id === 'submit'){
      this.checkText = this.TheSelectDisplays.controls['searchString'].value;
    } else {
      this.checkText = '';
      this.TheSelectDisplays.controls['searchString'].setValue('');
    }
  }


  lastInputAt: string = '';
  isMustSaveFile: boolean = false;

  reportCheckLockLimit(event: any) {
    this.checkLockLimit(event.iWait, event.isDataModified, event.isSaveFile);
  }

  checkLockLimit(iWait: number, isDataModified: boolean, isSaveFile: boolean) {

    var valueCheck = { action: '', lockValue: 0, lockAction: '' };
    if (this.identification.triggerFileSystem === "No") { //"No"
      valueCheck.action = "noAction";
    } else {
      valueCheck = fnCheckLockLimit(this.configServer, this.tabLock, iWait, this.lastInputAt, isDataModified, isSaveFile);
      if (iWait === 0 && this.tabLock[iWait].lock === 2) {
        this.isAllDataModified = false;
      }
    }
    if (valueCheck.action !== 'noAction') {
      if (valueCheck.action === 'updateSystemFile') {
        this.tabLock[iWait].action = valueCheck.lockAction;
        // this.updateSystemFile(iWait);
        this.onFileSystem(iWait);
      } else if (valueCheck.action === 'checkFile') {
        if ((iWait === 0 && this.isSaveHealth === false) || (iWait === 1 && this.isSaveCaloriesFat === false) || (iWait === 5 && this.isSaveParamChart === false)) {
          this.checkUpdateFile(iWait)
        } else {
          this.checkFile(iWait);
        }
      } else if (valueCheck.action === 'changeTabLock') {
        this.tabLock[iWait].lock = valueCheck.lockValue;
      } else if (iWait === 0 && valueCheck.action === 'ProcessSave') {
        this.ProcessSaveHealth(this.theEvent);
      } else if (iWait === 5 && valueCheck.action === 'ProcessSave') {
        this.processSaveParamChart();
      } else if (iWait === 1 && valueCheck.action === 'ProcessSave') {
        this.processSaveCaloriesFat(this.saveEvent);
      } else if (iWait === 0 && valueCheck.action === 'ConfirmSave') {
        this.isMustSaveFile = true;
        this.theEvent.target.id = 'All'; // ===== change value of target.id if created record or if selRecord  
        this.ConfirmSave(this.theEvent);
      }
    } else if (this.onInputAction === "onInputDailyAll") {
      this.onInputAction = "";
      this.onInputDailyAllA(this.theEvent);
    } else if (this.onInputAction === "onAction") {
      this.onInputAction = "";
      this.onActionA(this.theEvent);
    } else if (this.onInputAction === "onInputDaily") {
      this.onInputAction = "";
      this.onInputDailyA(this.theEvent);
    } else if (this.isConfirmSaveA === true) {
      this.ConfirmSave(this.theEvent);
    }
  }

  dateRangeSelection(event: any) {
    this.resetBooleans();
    this.error_msg = '';
    this.isRangeDateError = false;
    var startD = new Date();
    var endD = new Date();
    var search = 0;

    if (this.TheSelectDisplays.controls['startRange'].value !== '') {
      startD = this.TheSelectDisplays.controls['startRange'].value;
    } else { this.dateRangeStart = new Date() }
    if (this.TheSelectDisplays.controls['endRange'].value !== '') {
      endD = this.TheSelectDisplays.controls['endRange'].value;
    } else { endD = new Date(); }

    if (this.TheSelectDisplays.controls['startRange'].value !== '' && this.TheSelectDisplays.controls['endRange'].value === '') {
      search = 1;
    } else
      if (this.TheSelectDisplays.controls['startRange'].value !== '' && this.TheSelectDisplays.controls['endRange'].value !== '') {
        if (startD > endD) {
          this.isRangeDateError = true;
          this.error_msg = 'end date must be after startDate';
        } else { search = 2; } // range date selected  
      }

    if (this.error_msg === '') {
      if (event.target.id === 'selectCacCal') {
        this.dateRangeStart = startD;
        this.dateRangeEnd = endD;
        this.filterCalc = true;
        this.searchOneDate = search;

      } else if (event.target.id === 'selectAllData') {
        this.filterHealth = true;
        this.dateRangeStartHealth = startD;
        this.dateRangeEndHealth = endD;
        this.searchOneDateHealth = search;
      }
      this.TheSelectDisplays.controls['startRange'].setValue('');
      this.TheSelectDisplays.controls['endRange'].setValue('');
    }

  }

  CreateDropDownCalFat() {

    //this.tabType.splice(0,this.tabType.length);
    this.tabFood.splice(0, this.tabFood.length);
    var i = 0;
    var j = 0;

    for (i = 0; i < this.ConfigCaloriesFat.tabCaloriesFat.length; i++) {
      //this.tabType.push({name:''});
      //this.tabType[this.tabType.length-1].name=this.ConfigCaloriesFat.tabCaloriesFat[i].Type.toLowerCase().trim();
      for (j = 0; j < this.ConfigCaloriesFat.tabCaloriesFat[i].Content.length; j++) {
        this.tabFood.push({ name: '', serving: "", unit: "" });
        this.tabFood[this.tabFood.length - 1].name = this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Name.toLowerCase().trim();
        this.tabFood[this.tabFood.length - 1].serving = this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Serving;
        this.tabFood[this.tabFood.length - 1].unit = this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].ServingUnit.toLowerCase().trim();
      }
    }
    //this.tabType.sort((a, b) => (a.name < b.name) ? -1 : 1);
    this.tabFood.sort((a, b) => (a.name < b.name) ? -1 : 1);

  }

  cancelRange(event: any) {
    if (event.target.id === 'selectCacCal') {
      this.filterCalc = false;

    } else if (event.target.id === 'selectAllData') {
      this.filterHealth = false;
    }
  }

  SelectDisplay() {

    if (this.TheSelectDisplays.controls['CreateNew'].value === 'Y') {
      this.isCreateNew = true;
    } else {
      this.isCreateNew = false;
    }
    if (this.TheSelectDisplays.controls['DisplaySpecific'].value === 'Y') {
      this.isDisplaySpecific = true;
    } else {
      this.isDisplaySpecific = false;
    }
    if (this.TheSelectDisplays.controls['DisplayAll'].value === 'Y') {
      this.isDisplayAll = true;
    } else {
      this.isDisplayAll = false;
    }
  }

  onSelectedDate() {
    this.error_msg = '';
    this.errorFn = '';
    const selected = this.TheSelectDisplays.controls['SelectedDate'].value;
    this.isSelectedDateFound = false;
    var i = 0;
    for (i = 0; i < this.HealthAllData.tabDailyReport.length && this.HealthAllData.tabDailyReport[i].date !== this.TheSelectDisplays.controls['SelectedDate'].value; i++) { }
    if (i < this.HealthAllData.tabDailyReport.length) {
      // date is found
      this.SelectedRecord = new DailyReport;
      this.fillAllData(this.HealthAllData.tabDailyReport[i], this.SelectedRecord);

      //this.SelectedRecord=this.HealthAllData.tabDailyReport[i];
      this.isSelectedDateFound = true;
      this.SelectedRecordNb = i;
    } else { this.error_msg = 'no record found for this date'; this.errorFn = 'Sel'; }
  }

  CheckDupeDate(theDate: Date) {
    var i = 0;
    if (this.HealthAllData.tabDailyReport.length > 0) {
      for (i = 0; i < this.HealthAllData.tabDailyReport.length && this.HealthAllData.tabDailyReport[i].date !== theDate; i++) { }
      if (i < this.HealthAllData.tabDailyReport.length) {
        this.error_msg = 'This date already exists - please modify';
      }
    }
  }


  CreateTabFood(item: any, value: any) {

    var iTab: number = -1;
    this.error_msg = '';
    var nbDelItem = 0;
    if (item === 'Food') {
      if (this.tabInputFood.length > 0 && value.substring(0, this.strInputFood.length).toLowerCase() === this.strInputFood.toLowerCase().trim()) {

        for (var i = this.tabInputFood.length - 1; i > -1; i--) {
          if (this.tabInputFood[i].name.toLowerCase().trim().indexOf(value.toLowerCase().trim()) === -1) {
            this.tabInputFood.splice(i, 1);
            nbDelItem++
          }
        }
        console.log('nbDelItem=' + nbDelItem);
      } else {
        this.tabInputFood.splice(0, this.tabInputFood.length);
        //this.tabFood.sort((a, b) => (a.name < b.name) ? -1 : 1);

        for (var i = 0; i < this.tabFood.length; i++) {
          if (this.tabFood[i].name.toLowerCase().trim().indexOf(value.toLowerCase().trim()) !== -1) {
            iTab++;
            this.tabInputFood.push({ name: "", serving: "", unit: "" });
            this.tabInputFood[iTab].name = this.tabFood[i].name.toLowerCase().trim();
            this.tabInputFood[iTab].serving = this.tabFood[i].serving;
            this.tabInputFood[iTab].unit = this.tabFood[i].unit;
          }
        }
      }
      if (this.tabInputFood.length === 1) {
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].name = this.tabInputFood[0].name;
        //this.tabInputFood.splice(0,this.tabInputFood.length);
      }
      this.sizeBoxContentFood = this.sizeBox.heightItem * this.tabInputFood.length;
      if (this.sizeBoxContentFood > this.sizeBox.maxHeightContent) {
        this.sizeBoxContentFood = this.sizeBox.maxHeightContent;
        this.sizeBoxFood = this.sizeBox.maxHeightOptions;
        this.sizeBox.scrollY = "scroll";
      } else {
        this.sizeBoxFood = this.sizeBoxContentFood;
        this.sizeBox.scrollY = "hidden";
      }
      this.findPosItem(this.sizeBoxFood);
      /***
      this.styleBoxFood = {
        'width': this.sizeBoxContentFood + 'px',
        'height': this.sizeBox.widthContent + 'px',
        'position': 'absolute',
        'z-index': '1'
      }

      this.styleBoxOptionFood = {
        'background-color':'lightgrey',
        'height': this.sizeBoxFood + 'px',
        'width': this.sizeBox.widthOptions + 'px',
        'margin-left': this.offsetLeft + 90 + 'px',
        'margin-top' :  this.posItem + 1 + 'px',
        'overflow-x': 'hidden',
        'overflow-y': scrollY,
        'border':'1px lightgrey solid'
        }
      */
      this.styleBoxFood = getStyleDropDownContent(this.sizeBoxContentFood, this.sizeBox.widthContent);
      this.styleBoxOptionFood = getStyleDropDownBox(this.sizeBoxFood, this.sizeBox.widthOptions, this.offsetLeft + 100, this.posItem, this.sizeBox.scrollY); // this.offsetLeft - 25   this.posItem +40

    }
    else if (item === 'Meal') {
      this.tabInputMeal.splice(0, this.tabInputMeal.length);

      for (var i = 0; i < this.tabMeal.length; i++) {
        if (this.tabMeal[i].name.substr(0, value.trim().length).toLowerCase().trim() === value.toLowerCase().trim()) {
          iTab++;
          this.tabInputMeal[iTab] = this.tabMeal[i].name.toLowerCase().trim();
        }
      }
      this.sizeBoxContentMeal = this.sizeBox.heightItem * this.tabInputMeal.length;
      if (this.sizeBoxContentMeal > this.sizeBox.maxHeightContent) {
        this.sizeBoxContentMeal = this.sizeBox.maxHeightContent;
        this.sizeBoxMeal = this.sizeBox.maxHeightOptions;
      } else {
        this.sizeBoxMeal = this.sizeBoxContentMeal;
        this.sizeBox.scrollY = "scroll";
      }
      this.findPosItem(this.sizeBoxMeal);
      this.sizeBox.scrollY = "hidden";

      this.styleBoxMeal = getStyleDropDownContent(this.sizeBoxContentMeal, this.sizeBox.widthContent - 50);
      //this.styleBoxOptionMeal=getStyleDropDownBox(this.sizeBoxMeal, this.sizeBox.widthOptions - 50, this.offsetLeft - 20,  this.selectedPosition.y - this.posDivAfterTitle.Client.Top  - 255, this.sizeBox.scrollY);
      this.styleBoxOptionMeal = getStyleDropDownBox(this.sizeBoxMeal, this.sizeBox.widthOptions - 50, this.offsetLeft - 25, this.posItem + 40, this.sizeBox.scrollY);
    }

  }

  onSelMealFood(event: any) {
    //this.resetBooleans();
    this.error_msg = '';
    this.manageIds(event.target.id);
    if (event.currentTarget.id.substring(0, 7) === 'selFood') {
      //this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].name =event.target.textContent.toLowerCase().trim();
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].name = this.tabInputFood[this.TabOfId[3]].name;
      this.tabInputFood.splice(0, this.tabInputFood.length);
    } else if (event.currentTarget.id.substring(0, 7) === 'selMeal') {
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].name = event.target.textContent.toLowerCase().trim();
      this.tabInputMeal.splice(0, this.tabInputMeal.length);
    }
  }

  onInputDaily(event: any) {
    this.theEvent.target.id = event.target.id;
    this.theEvent.target.textContent = event.target.textContent;
    this.theEvent.target.value = event.target.value;
    this.onInputAction = 'onInputDaily';
    this.lastInputAt = strDateTime();
    this.checkLockLimit(0, this.isAllDataModified, this.isSaveHealth);
  }

  onInputDailyA(event: any) {

    //this.lastInputAt=strDateTime();
    //this.checkLockLimit(0, this.isAllDataModified, this.isSaveHealth);

    if (this.tabLock[0].lock !== 2) {
      this.resetBooleans();
      this.error_msg = '';
      var i = 0;
      const fieldName = event.target.id.substring(0, 4);
      this.manageIds(event.target.id);
      if (event.target.id.substring(0, 3) !== 'Sel') {
        this.errorFn = 'Cre';
        if (fieldName === 'ingr') {
          this.isInputFood = true;
          this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
          this.CreateTabFood('Food', event.target.value);
          if (this.tabInputFood.length === 1 && event.target.value.length > this.strInputFood.length) {
            this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].name = this.tabInputFood[0].name;
            //this.tabInputFood.splice(0, this.tabInputFood.length)
          } else {
            this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].name = event.target.value;
          }
          this.strInputFood = event.target.value;
        } else if (fieldName === 'date') {
          this.CheckDupeDate(event.target.value);
          this.HealthData.tabDailyReport[this.TabOfId[0]].date = event.target.value;
          this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
        } else if (fieldName === 'meal') {
          this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].name = event.target.value;
          this.CreateTabFood('Meal', event.target.value);
          this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
        } else if (fieldName === 'quan') {
          this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].quantity = event.target.value;
          this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
        } else if (fieldName === 'unit') {
          this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].unit = event.target.value;
          this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
        } else if (fieldName === 'burn') {
          this.HealthData.tabDailyReport[this.TabOfId[0]].burntCalories = event.target.value;
          this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
        }
      } else if (event.target.id.substring(0, 7) === 'Selmeal') {
        this.errorFn = 'Sel';
        this.SelectedRecord.meal[this.TabOfId[0]].name = event.target.value;
      } else if (event.target.id.substring(0, 7) === 'Selingr') {
        this.SelectedRecord.meal[this.TabOfId[0]].dish[this.TabOfId[1]].name = event.target.value;
      } else if (event.target.id.substring(0, 7) === 'Selquan') {
        this.SelectedRecord.meal[this.TabOfId[0]].dish[this.TabOfId[1]].quantity = event.target.value;
      } else if (event.target.id.substring(0, 7) === 'Selunit') {
        this.SelectedRecord.meal[this.TabOfId[0]].dish[this.TabOfId[1]].unit = event.target.value;
      } else if (event.target.id.substring(0, 7) === 'Selburn') {
        this.SelectedRecord.burntCalories = event.target.value;
      } else if (event.target.id.substring(0, 7) === 'Seldate') {
        if (event.target.value !== this.TheSelectDisplays.controls['SelectedDate'].value) {
          this.CheckDupeDate(event.target.value);
        }
        this.SelectedRecord.date = event.target.value;
      }
    }
  }

  offsetHeight: number = 0;
  offsetLeft: number = 0;
  offsetTop: number = 0;
  offsetWidth: number = 0;
  scrollHeight: number = 0;
  scrollTop: number = 0;

  onInputDailyAll(event: any) {
    this.theEvent.target.id = event.target.id;
    this.theEvent.target.textContent = event.target.textContent;
    this.theEvent.target.value = event.target.value;
    this.onInputAction = 'onInputDailyAll';
    this.offsetLeft = event.currentTarget.offsetLeft;
    this.offsetWidth = event.currentTarget.offsetWidth;
    this.lastInputAt = strDateTime();
    if (event.target.value.length===1){
      this.checkLockLimit(0, this.isAllDataModified, this.isSaveHealth);
    } else {
      this.onInputDailyAllA(event);
    }
    
  }

  onInputDailyAllA(event: any) {
    if (this.tabLock[0].lock !== 2) {
      this.resetBooleans();
      this.isAllDataModified = true;
      this.error_msg = '';
      var i = 0;
      const fieldName = event.target.id.substring(0, 7);
      this.manageIds(event.target.id);
      if (fieldName === 'ingrAll') {
        this.isInputFood = true;
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;

        this.CreateTabFood('Food', event.target.value);

        if (this.tabInputFood.length === 1 && event.target.value.length > this.strInputFood.length) {
          this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].name = this.tabInputFood[0].name;
          //this.tabInputFood.splice(0, this.tabInputFood.length)
        } else {
          this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].name = event.target.value;
        }
        this.strInputFood = event.target.value;
      } else if (fieldName === 'quanAll') {
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].quantity = event.target.value;
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
      } else if (fieldName === 'unitAll') {
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].unit = event.target.value;
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
      } else if (fieldName === 'dateAll') {
        this.CheckDupeDate(event.target.value);
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].date = event.target.value;
        this.tabNewRecordAll[this.TabOfId[0]].nb = 1;
      } else if (fieldName === 'mealAll') {
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].name = event.target.value;
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].nb = 1;
        this.CreateTabFood('Meal', event.target.value);
      } else if (fieldName === 'burnAll') {
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].burntCalories = event.target.value;
        this.tabNewRecordAll[this.TabOfId[0]].nb = 1;
      }
    }
  }

  findAction(idString: string) {
    this.error_msg = '';
    var j = -1;
    for (var i = 1; i < idString.length && idString.substring(i, i + 1) !== ':'; i++) {
    }
    this.myType = idString.substring(0, i).trim();
    this.myAction = idString.substring(i + 1).trim();
  }

  onDropDownAll(event: any) {
    this.theEvent.target.id = 'selAction-' + this.TabOfId[0] + '-' + this.TabOfId[1] + '-' + this.TabOfId[2];
    this.theEvent.target.textContent = event.target.textContent;
    this.onAction(this.theEvent);
  }


  posDelConfirm: number = 0;
  posDelDate = 330;
  posDelMeal = 410;
  posDelIngr = 480;
  delMsg: string = '';

  DelAfterConfirm(event: any) {
    this.resetBooleans();
    this.isDeleteItem = false;
    if (event.currentTarget.id.substring(0, 13) === 'YesDelConfirm') {
      if (this.theEvent.target.id.substring(0, 10) === 'DelAllDate') {
        this.theEvent.target.id = 'DelAllDate-' + this.TabOfId[0];

        this.DeleteDay(this.theEvent);

      }
      else
        if (this.theEvent.target.id.substring(0, 10) === 'DelAllMeal') {
          this.theEvent.target.id = 'DelAllMeal-' + this.TabOfId[0] + '-' + this.TabOfId[1];

          this.DeleteMeal(this.theEvent);

        }
        else
          if (this.theEvent.target.id.substring(0, 7) === 'DelAll-') {
            this.theEvent.target.id = 'DelAll-' + this.TabOfId[0] + '-' + this.TabOfId[1] + '-' + this.TabOfId[2];

            this.DeleteIngredient(this.theEvent);

          }
    }
  }

  onNoAction(event: any) {
    console.log('no action ');
  }

  onInputAction: string = '';

  onAction(event: any) {
    this.theEvent.target.id = event.target.id;
    this.theEvent.target.textContent = event.target.textContent;
    this.onInputAction = 'onAction';
    this.lastInputAt = strDateTime();
    this.checkLockLimit(0, this.isAllDataModified, this.isSaveHealth);
  }

  onActionA(event: any) {

    //this.lastInputAt=strDateTime();
    //this.checkLockLimit(0, this.isAllDataModified, this.isSaveHealth);
    this.resetBooleans();
    if (this.tabLock[0].lock !== 2) {

      this.manageIds(event.target.id);
      this.dialogue[this.prevDialogue] = false;
      if (this.tabLock[0].lock === 0 && event.target.id.substring(0, 10) !== 'openAction') {
        this.isAllDataModified = true;
        this.checkLockLimit(0, this.isAllDataModified, this.isSaveHealth);
      }
      else {
        if (event.target.id.substring(0, 10) === 'openAction') {
          this.prevDialogue = 6;
          this.dialogue[this.prevDialogue] = true;
          this.sizeBox.heightOptions = this.sizeBox.heightItem * (this.NewTabAction.length) + 10;
          this.sizeBox.heightContent = this.sizeBox.heightOptions;
          this.findPosItem(this.sizeBox.heightOptions);

          this.styleBox = getStyleDropDownContent(this.sizeBox.heightContent, this.sizeBox.widthContent);
          // this.styleBoxOption=getStyleDropDownBox(this.sizeBox.heightOptions, this.sizeBox.widthOptions,  60, this.selectedPosition.y - this.posDivAfterTitle.Client.Top - 279, this.sizeBox.scrollY);
          this.styleBoxOption = getStyleDropDownBox(this.sizeBox.heightOptions, this.sizeBox.widthOptions, 60, this.posItem, this.sizeBox.scrollY);

        } else if (event.target.id.substring(0, 9) === 'selAction') {
          if (event.target.textContent.indexOf('cancel') !== -1) {
          } else {
            this.isAllDataModified = true;

            this.findAction(event.target.textContent);
            if (this.myType.trim() === "date") {
              if (this.myAction === "insert after") {
                this.theEvent.target.id = 'AllDateA-' + this.TabOfId[0];
                this.CreateDay(this.theEvent);
              } else if (this.myAction === "insert before") {
                this.theEvent.target.id = 'AllDateB-' + this.TabOfId[0];
                this.CreateDay(this.theEvent);
              } else if (this.myAction === "delete") {
                this.theEvent.target.id = 'DelAllDate-' + this.TabOfId[0];
                this.delMsg = ' date=' + this.HealthAllData.tabDailyReport[this.TabOfId[0]].date;
                this.posDelConfirm = this.posDelDate;
                this.isDeleteItem = true;

              }

            } else if (this.myType.trim() === "meal") {
              if (this.myAction === "insert after") {
                this.theEvent.target.id = 'AllMealA-' + this.TabOfId[0] + '-' + this.TabOfId[1];
                this.CreateMeal(this.theEvent);

              } else if (this.myAction === "insert before") {
                this.theEvent.target.id = 'AllMealB-' + this.TabOfId[0] + '-' + this.TabOfId[1];
                this.CreateMeal(this.theEvent);

              } else if (this.myAction === "delete") {
                this.theEvent.target.id = 'DelAllMeal-' + this.TabOfId[0] + '-' + this.TabOfId[1];
                this.delMsg = ' meal=' + this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].name;
                this.posDelConfirm = this.posDelMeal;
                this.isDeleteItem = true;

              }

            } else if (this.myType.trim() === "food") {
              if (this.myAction === "insert before") {
                this.theEvent.target.id = 'AllIngrB-' + this.TabOfId[0] + '-' + this.TabOfId[1] + '-' + this.TabOfId[2];
                this.CreateIngredient(this.theEvent);

              } else if (this.myAction === "insert after") {
                this.theEvent.target.id = 'AllIngrA-' + this.TabOfId[0] + '-' + this.TabOfId[1] + '-' + this.TabOfId[2];
                this.CreateIngredient(this.theEvent);

              } else if (this.myAction === "delete") {
                this.theEvent.target.id = 'DelAll-' + this.TabOfId[0] + '-' + this.TabOfId[1] + '-' + this.TabOfId[2];
                this.isDeleteItem = true;
                this.delMsg =
                  ' ingredient ' + this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].name
                  + ' of meal ' + this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].name;;
                this.posDelConfirm = this.posDelIngr;
              }
            }
          }
        }
        else if (event.target.id.substring(0, 15) === 'CreDialogueDate') {
          this.prevDialogue = 0;
          this.dialogue[this.prevDialogue] = true;
        } else if (event.target.id.substring(0, 15) === 'CreDialogueMeal') {
          this.prevDialogue = 1;
          this.dialogue[this.prevDialogue] = true;
        } else if (event.target.id.substring(0, 15) === 'CreDialogueIngr') {
          this.prevDialogue = 2;
          this.dialogue[this.prevDialogue] = true;
        } else if (event.target.id.substring(0, 15) === 'SelDialogueDate') {
          this.prevDialogue = 3;
          this.dialogue[this.prevDialogue] = true;
        } else if (event.target.id.substring(0, 15) === 'SelDialogueMeal') {
          this.prevDialogue = 4;
          this.dialogue[this.prevDialogue] = true;
        } else if (event.target.id.substring(0, 15) === 'SelDialogueIngr') {
          this.prevDialogue = 5;
          this.dialogue[this.prevDialogue] = true;
        } else if (event.target.id.substring(0, 7) === 'SelMeal') {
          if (event.target.textContent === 'insert after') {
            this.theEvent.target.id = 'SelMealA-' + this.TabOfId[0];
            this.CreateMeal(this.theEvent);

          } else if (event.target.textContent === 'insert before') {
            this.theEvent.target.id = 'SelMealB-' + this.TabOfId[0];
            this.CreateMeal(this.theEvent);

          } else if (event.target.textContent === 'delete') {
            this.theEvent.target.id = 'DelSelMeal-' + this.TabOfId[0];
            this.DeleteMeal(this.theEvent);

          }
        } else if (event.target.id.substring(0, 7) === 'SelIngr') {
          if (event.target.textContent === 'insert after') {
            this.theEvent.target.id = 'SelIngrA-' + this.TabOfId[0] + '-' + this.TabOfId[1];
            this.CreateIngredient(this.theEvent);

          } else if (event.target.textContent === 'insert before') {
            this.theEvent.target.id = 'SelIngrB-' + this.TabOfId[0] + '-' + this.TabOfId[1];
            this.CreateIngredient(this.theEvent);

          } else if (event.target.textContent === 'delete') {
            this.theEvent.target.id = 'DelSelIngr-' + this.TabOfId[0] + '-' + this.TabOfId[1];
            this.DeleteIngredient(this.theEvent);

          }
        } else if (event.target.id.substring(0, 7) === 'CreMeal') {
          if (event.target.textContent === 'insert after') {
            this.theEvent.target.id = 'CreMealA-' + this.TabOfId[0] + '-' + this.TabOfId[1];
            this.CreateMeal(this.theEvent);

          } else if (event.target.textContent === 'insert before') {
            this.theEvent.target.id = 'CreMealB-' + this.TabOfId[0] + '-' + this.TabOfId[1];
            this.CreateMeal(this.theEvent);

          } else if (event.target.textContent === 'delete') {
            this.theEvent.target.id = 'DelCreMeal-' + this.TabOfId[0] + '-' + this.TabOfId[1];
            this.DeleteMeal(this.theEvent);

          }
        } else if (event.target.id.substring(0, 7) === 'CreIngr') {
          if (event.target.textContent === 'insert after') {
            this.theEvent.target.id = 'CreIngrA-' + this.TabOfId[0] + '-' + this.TabOfId[1] + '-' + this.TabOfId[2];
            this.CreateIngredient(this.theEvent);

          } else if (event.target.textContent === 'insert before') {
            this.theEvent.target.id = 'CreIngrB-' + this.TabOfId[0] + '-' + this.TabOfId[1] + '-' + this.TabOfId[2];
            this.CreateIngredient(this.theEvent);

          } else if (event.target.textContent === 'delete') {
            this.theEvent.target.id = 'DelCreIngr-' + this.TabOfId[0] + '-' + this.TabOfId[1] + '-' + this.TabOfId[2];
            this.DeleteIngredient(this.theEvent);

          }
        } else if (event.target.id.substring(0, 10) === 'ActionDate') {
          if (event.target.textContent === 'insert after') {
            this.theEvent.target.id = 'DateA-' + this.TabOfId[0];
            this.CreateDay(this.theEvent);

          } else if (event.target.textContent === 'insert before') {
            this.theEvent.target.id = 'DateB-' + this.TabOfId[0];
            this.CreateDay(this.theEvent);

          } else if (event.target.textContent === 'delete') {
            this.theEvent.target.id = 'DelDate-' + this.TabOfId[0];
            this.DeleteDay(this.theEvent);

          }
        }


        if (this.prevDialogue < 6) {
          this.sizeBox.heightOptions = this.sizeBox.heightItem * (this.TabAction.length + 1);
          this.sizeBox.heightContent = this.sizeBox.heightOptions;

          this.styleBox = getStyleDropDownContent(this.sizeBox.heightContent, this.sizeBox.widthContent);
          this.styleBoxOption = getStyleDropDownBox(this.sizeBox.heightOptions, this.sizeBox.widthOptions, 30, 0, this.sizeBox.scrollY);


        } else if (this.isDeleteItem === true) {
          this.sizeBox.heightOptions = 90;
          this.sizeBox.heightContent = 90;

          this.styleBox = getStyleDropDownContent(this.sizeBox.heightContent, 240);
          //this.styleBoxOption=getStyleDropDownBox(this.sizeBox.heightOptions, 240,  60, this.selectedPosition.y - this.posDivAfterTitle.Client.Top - this.posDelConfirm, this.sizeBox.scrollY);
          this.styleBoxOption = getStyleDropDownBox(this.sizeBox.heightOptions, 240, 60, this.posItem, this.sizeBox.scrollY);

        }
      }
    }
  }

  DeleteIngredient(event: any) {
    this.manageIds(event.target.id);
    if (event.target.id.substring(0, 6) === 'DelCre') {
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.splice(this.TabOfId[2], 1);
      if (this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.length === 0) {
        this.theEvent.target.id = 'CreIngrA-' + this.TabOfId[0];
        this.CreateIngredient(this.theEvent);
      } else {
        this.tabNewRecordAll.splice(this.TabOfId[0].meal[this.TabOfId[1]].dish.splice(this.TabOfId[2], 1));
      }
    } else if (event.target.id.substring(0, 6) === 'DelSel') {
      this.SelectedRecord.meal[this.TabOfId[0]].dish.splice(this.TabOfId[1], 1);
      if (this.SelectedRecord.meal[this.TabOfId[1]].dish.length === 0) {
        this.theEvent.target.id = 'SelIngrA-' + this.TabOfId[0];
        this.CreateIngredient(this.theEvent);
      }
    } else if (event.target.id.substring(0, 6) === 'DelAll') {
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.splice(this.TabOfId[2], 1);
      this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food.splice(this.TabOfId[2], 1);
      if (this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.length === 0) {
        this.theEvent.target.id = 'AllIngrA-' + this.TabOfId[0] + '-' + this.TabOfId[1] + '-' + this.TabOfId[2];
        this.CreateIngredient(this.theEvent);

      }
    }
  }

  DeleteMeal(event: any) {
    this.manageIds(event.target.id);
    if (event.target.id.substring(0, 6) === 'DelCre') {
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal.splice(this.TabOfId[1], 1);
      if (this.HealthData.tabDailyReport[this.TabOfId[0]].meal.length === 0) {
        this.theEvent.target.id = 'CreMealA-' + this.TabOfId[0];
        this.CreateMeal(this.theEvent);
      }
    } else if (event.target.id.substring(0, 6) === 'DelSel') {
      this.SelectedRecord.meal.splice(this.TabOfId[0], 1);
      if (this.SelectedRecord.meal.length === 0) {
        this.theEvent.target.id = 'SellMealA-' + this.TabOfId[0];
        this.CreateMeal(this.theEvent);
      }
    } else if (event.target.id.substring(0, 6) === 'DelAll') {
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal.splice(this.TabOfId[1], 1);
      this.tabNewRecordAll[this.TabOfId[0]].meal.splice(this.TabOfId[1], 1);
      if (this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal.length === 0) {
        this.theEvent.target.id = 'AllMealA-' + this.TabOfId[0] + '-' + this.TabOfId[1];
        this.CreateMeal(this.theEvent);
      }
    }
  }

  DeleteDay(event: any) {
    this.manageIds(event.target.id);
    if (event.target.id.substring(0, 10) === 'DelAllDate') {
      this.HealthAllData.tabDailyReport.splice(this.TabOfId[0], 1);
      this.tabNewRecordAll.splice(this.TabOfId[0], 1);
    } else if (event.target.id.substring(0, 7) === 'DelDate') {
      this.HealthData.tabDailyReport.splice(this.TabOfId[0], 1);
      if (this.HealthData.tabDailyReport.length === 0) {
        this.theEvent.target.id = 'New';
        this.CreateDay(this.theEvent);
      }
    }
  }

  CreateIngredient(event: any) {
    this.manageIds(event.target.id);
    const theIngredient = new ClassDish;
    if (event.target.id.substring(0, 8) === 'CreIngrA') {
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.splice(this.TabOfId[2] + 1, 0, theIngredient);
    } if (event.target.id.substring(0, 8) === 'CreIngrB') {
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.splice(this.TabOfId[2], 0, theIngredient);
    } else if (event.target.id.substring(0, 8) === 'SelIngrA') { // create after current ingredient
      this.SelectedRecord.meal[this.TabOfId[0]].dish.splice(this.TabOfId[1] + 1, 0, theIngredient);
    } else if (event.target.id.substring(0, 8) === 'SelIngrB') { // create before current ingredient
      this.SelectedRecord.meal[this.TabOfId[0]].dish.splice(this.TabOfId[1], 0, theIngredient);
    } if (event.target.id.substring(0, 8) === 'AllIngrA') {
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.splice(this.TabOfId[2] + 1, 0, theIngredient);
      this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food.splice(this.TabOfId[2] + 1, 0, { nb: 1 });
    } if (event.target.id.substring(0, 8) === 'AllIngrB') {
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.splice(this.TabOfId[2], 0, theIngredient);
      this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food.splice(this.TabOfId[2], 0, { nb: 1 });
    }

  }

  CreateMeal(event: any) {
    this.manageIds(event.target.id);
    const theMeal = new ClassMeal;
    if (event.target.id.substring(0, 8) === 'CreMealA') {
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal.splice(this.TabOfId[1] + 1, 0, theMeal);
      const theIngredient = new ClassDish;
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1] + 1].dish.push(theIngredient);
    } else if (event.target.id.substring(0, 8) === 'CreMealB') { // create before current  meal
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal.splice(this.TabOfId[1], 0, theMeal);
      const theIngredient = new ClassDish;
      this.HealthData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.push(theIngredient);
    } else if (event.target.id.substring(0, 8) === 'SelMealA') { // create after current  meal
      this.SelectedRecord.meal.splice(this.TabOfId[0] + 1, 0, theMeal);
      const theIngredient = new ClassDish;
      this.SelectedRecord.meal[this.TabOfId[0] + 1].dish.push(theIngredient);
    } else if (event.target.id.substring(0, 8) === 'SelMealB') { // create before current  meal
      this.SelectedRecord.meal.splice(this.TabOfId[0], 0, theMeal);
      const theIngredient = new ClassDish;
      this.SelectedRecord.meal[this.TabOfId[0]].dish.push(theIngredient);
    } else if (event.target.id.substring(0, 8) === 'AllMealA') {
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal.splice(this.TabOfId[1] + 1, 0, theMeal);
      const theIngredient = new ClassDish;
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1] + 1].dish.push(theIngredient);
      const trackNew = { nb: 1, food: [{ nb: 1 }] };
      this.tabNewRecordAll[this.TabOfId[0]].meal.splice(this.TabOfId[1] + 1, 0, trackNew);
    } else if (event.target.id.substring(0, 8) === 'AllMealB') { // create before current  meal
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal.splice(this.TabOfId[1], 0, theMeal);
      const theIngredient = new ClassDish;
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish.push(theIngredient);
      const trackNew = { nb: 1, food: [{ nb: 1 }] };
      this.tabNewRecordAll[this.TabOfId[0]].meal.splice(this.TabOfId[1], 0, trackNew);
    }

  }

  CreateDay(event: any) {
    this.manageIds(event.target.id);
    const theDaily = new DailyReport;
    var iDate = 0;
    if (event.target.id.substring(0, 8) === 'AllDateA') {
      this.HealthAllData.tabDailyReport.splice(this.TabOfId[0] + 1, 0, theDaily);
      iDate = this.TabOfId[0] + 1;
      const trackNew = { nb: 1, meal: [{ nb: 1, food: [{ nb: 1 }] }] };
      this.tabNewRecordAll.splice(this.TabOfId[0] + 1, 0, trackNew);
    } else if (event.target.id.substring(0, 8) === 'AllDateB') {
      this.HealthAllData.tabDailyReport.splice(this.TabOfId[0], 0, theDaily)
      iDate = this.TabOfId[0];
      const trackNew = { nb: 1, meal: [{ nb: 1, food: [{ nb: 1 }] }] };
      this.tabNewRecordAll.splice(this.TabOfId[0], 0, trackNew);
    } if (event.target.id.substring(0, 5) === 'DateA') {
      this.HealthData.tabDailyReport.splice(this.TabOfId[0] + 1, 0, theDaily);
      iDate = this.TabOfId[0] + 1;
    } else if (event.target.id.substring(0, 5) === 'DateB') {
      this.HealthData.tabDailyReport.splice(this.TabOfId[0], 0, theDaily)
      iDate = this.TabOfId[0];
    } else if (event.target.id === 'New') {
      this.HealthData.tabDailyReport.push(theDaily);
      iDate = this.HealthData.tabDailyReport.length - 1;
    }
    if (event.target.id.substring(0, 7) === 'AllDate') {
      const theMeal = new ClassMeal;
      this.HealthAllData.tabDailyReport[iDate].meal.push(theMeal);
      const theIngredient = new ClassDish;
      this.HealthAllData.tabDailyReport[iDate].meal[0].dish.push(theIngredient);
    } else if (event.target.id.substring(0, 4) === 'Date' || event.target.id.substring(0, 3) === 'New') {
      const theMeal = new ClassMeal;
      this.HealthData.tabDailyReport[iDate].meal.push(theMeal);
      const theIngredient = new ClassDish;
      this.HealthData.tabDailyReport[iDate].meal[0].dish.push(theIngredient);
    }
  }

  FillHealthAllInOut(outFile: any, inFile: any) {
    var iOut = -1;
    if (inFile.updatedAt !== undefined) {
      outFile.updatedAt = inFile.updatedAt;
    } else { outFile.updatedAt = ''; }
    for (var i = 0; i < inFile.tabDailyReport.length; i++) {
      // if (inFile.tabDailyReport[i].meal.length!==0){

      iOut++

      this.fillHealthOneDay(outFile, inFile, i, iOut);
      //    }
    }

  }

  fillHealthOneDay(outFile: any, inFile: any, i:number, iOut:number) {
    const theDaily = new DailyReport;
    outFile.tabDailyReport.push(theDaily);
    outFile.tabDailyReport[iOut].burntCalories = inFile.tabDailyReport[i].burntCalories;
    outFile.tabDailyReport[iOut].date = inFile.tabDailyReport[i].date;
    outFile.tabDailyReport[iOut].total = inFile.tabDailyReport[i].total;
    var jOut = -1;
    for (var j = 0; j < inFile.tabDailyReport[i].meal.length; j++) {
      if (inFile.tabDailyReport[i].meal[j].dish.length > 0) {
        const theMeal = new ClassMeal;
        outFile.tabDailyReport[iOut].meal.push(theMeal);
        jOut++
        outFile.tabDailyReport[iOut].meal[jOut].name = inFile.tabDailyReport[i].meal[j].name;
        outFile.tabDailyReport[iOut].meal[jOut].total = inFile.tabDailyReport[i].meal[j].total;
        var lOut = -1;
        for (var k = 0; k < inFile.tabDailyReport[i].meal[j].dish.length; k++) {
          if (inFile.tabDailyReport[i].meal[j].dish[k].name !== '') {
            const theIngr = new ClassDish;
            outFile.tabDailyReport[iOut].meal[jOut].dish.push(theIngr);
            lOut++
            outFile.tabDailyReport[iOut].meal[jOut].dish[lOut].name = inFile.tabDailyReport[i].meal[j].dish[k].name;
            outFile.tabDailyReport[iOut].meal[jOut].dish[lOut].quantity = inFile.tabDailyReport[i].meal[j].dish[k].quantity;
            outFile.tabDailyReport[iOut].meal[jOut].dish[lOut].unit = inFile.tabDailyReport[i].meal[j].dish[k].unit;
            outFile.tabDailyReport[iOut].meal[jOut].dish[lOut].calFat = inFile.tabDailyReport[i].meal[j].dish[k].calFat;
          } else {
            const theIngr = new ClassDish;
            outFile.tabDailyReport[iOut].meal[jOut].dish.push(theIngr);
            lOut++
          }
        }
      } else {
        const theMeal = new ClassMeal;
        outFile.tabDailyReport[iOut].meal.push(theMeal);
        jOut++
        const theIngr = new ClassDish;
        outFile.tabDailyReport[iOut].meal[jOut].dish.push(theIngr);
      }
    }
  }

  manageIds(theId: string) {
    this.error_msg = '';
    this.TabOfId.splice(0, this.TabOfId.length);
    const theValue = findIds(theId, "-");

    for (var i = 0; i < theValue.tabOfId.length; i++) {
      this.TabOfId[i] = theValue.tabOfId[i];
    }
  }
  /*
  findIds(theId:string){
    this.error_msg='';
    
    var TabDash=[];
    this.TabOfId.splice(0,this.TabOfId.length);
    var j=-1;
    for (var i=4; i<theId.length; i++){
      if (theId.substring(i,i+1)==='-'){
          j++;
          TabDash[j]=i+1;
          TabDash.push(0);
      }
    }
    TabDash[j+1]=theId.length+1;
  
    i=0;
    for (j=0; j<TabDash.length-1; j++){
      this.TabOfId[i]=parseInt(theId.substring(TabDash[j],TabDash[j+1]-1));
      i++;
    }
  }
  */
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
    // this.alignRecord();
  }

  alignRecord() {
    for (var i = 0; i < this.HealthAllData.tabDailyReport.length; i++) {
      if (this.HealthAllData.tabDailyReport[i].total.Carbs === undefined) {
        this.theEvent.target.id = 'AllDateA-' + i;
        this.CreateDay(this.theEvent);
        this.HealthAllData.tabDailyReport[i + 1].date = this.HealthAllData.tabDailyReport[i].date;
        this.HealthAllData.tabDailyReport[i + 1].burntCalories = this.HealthAllData.tabDailyReport[i].burntCalories;
        this.HealthAllData.tabDailyReport[i + 1].total.Calories = this.HealthAllData.tabDailyReport[i].total.Calories;
        this.HealthAllData.tabDailyReport[i + 1].total.Cholesterol = this.HealthAllData.tabDailyReport[i].total.Cholesterol;
        this.HealthAllData.tabDailyReport[i + 1].total.Name = this.HealthAllData.tabDailyReport[i].total.Name;
        this.HealthAllData.tabDailyReport[i + 1].total.GlyIndex = this.HealthAllData.tabDailyReport[i].total.GlyIndex;
        this.HealthAllData.tabDailyReport[i + 1].total.Serving = this.HealthAllData.tabDailyReport[i].total.Serving;
        this.HealthAllData.tabDailyReport[i + 1].total.ServingUnit = this.HealthAllData.tabDailyReport[i].total.ServingUnit;
        this.HealthAllData.tabDailyReport[i + 1].total.Sugar = this.HealthAllData.tabDailyReport[i].total.Sugar;
        this.HealthAllData.tabDailyReport[i + 1].total.Fat.Saturated = this.HealthAllData.tabDailyReport[i].total.Fat.Saturated;
        this.HealthAllData.tabDailyReport[i + 1].total.Fat.Total = this.HealthAllData.tabDailyReport[i].total.Fat.Total;
        this.HealthAllData.tabDailyReport[i + 1].total.Carbs = this.HealthAllData.tabDailyReport[i].total.Carbs;
        this.HealthAllData.tabDailyReport[i + 1].total.Protein = this.HealthAllData.tabDailyReport[i].total.Protein;

        for (var j = 0; j < this.HealthAllData.tabDailyReport[i].meal.length; j++) {
          if (j > 0) {
            const nb1 = i + 1;
            const nb2 = j - 1;
            this.theEvent.target.id = 'AllMealA-' + nb1 + '-' + nb2;
            this.CreateMeal(this.theEvent);
          }
          this.HealthAllData.tabDailyReport[i + 1].meal[j].total.Calories = this.HealthAllData.tabDailyReport[i].meal[j].total.Calories;
          this.HealthAllData.tabDailyReport[i + 1].meal[j].total.Cholesterol = this.HealthAllData.tabDailyReport[i].meal[j].total.Cholesterol;
          this.HealthAllData.tabDailyReport[i + 1].meal[j].total.Name = this.HealthAllData.tabDailyReport[i].meal[j].total.Name;
          this.HealthAllData.tabDailyReport[i + 1].meal[j].total.GlyIndex = this.HealthAllData.tabDailyReport[i].meal[j].total.GlyIndex;
          this.HealthAllData.tabDailyReport[i + 1].meal[j].total.Serving = this.HealthAllData.tabDailyReport[i].meal[j].total.Serving;
          this.HealthAllData.tabDailyReport[i + 1].meal[j].total.ServingUnit = this.HealthAllData.tabDailyReport[i].meal[j].total.ServingUnit;
          this.HealthAllData.tabDailyReport[i + 1].meal[j].total.Sugar = this.HealthAllData.tabDailyReport[i].meal[j].total.Sugar;
          this.HealthAllData.tabDailyReport[i + 1].meal[j].total.Fat.Saturated = this.HealthAllData.tabDailyReport[i].meal[j].total.Fat.Saturated;
          this.HealthAllData.tabDailyReport[i + 1].meal[j].total.Fat.Total = this.HealthAllData.tabDailyReport[i].meal[j].total.Fat.Total;
          this.HealthAllData.tabDailyReport[i + 1].meal[j].total.Carbs = this.HealthAllData.tabDailyReport[i].meal[j].total.Carbs;
          this.HealthAllData.tabDailyReport[i + 1].meal[j].total.Protein = this.HealthAllData.tabDailyReport[i].meal[j].total.Protein;
          this.HealthAllData.tabDailyReport[i + 1].meal[j].name = this.HealthAllData.tabDailyReport[i].meal[j].name;
          for (var k = 0; k < this.HealthAllData.tabDailyReport[i].meal[j].dish.length; k++) {
            if (k > 0) {
              const nb1 = i + 1;
              const nb2 = j;
              const nb3 = k - 1;
              this.theEvent.target.id = 'AllIngrA-' + nb1 + '-' + nb2 + '-' + nb3;
              this.CreateIngredient(this.theEvent);
            }

            this.HealthAllData.tabDailyReport[i + 1].meal[j].dish[k].name = this.HealthAllData.tabDailyReport[i].meal[j].dish[k].name;
            this.HealthAllData.tabDailyReport[i + 1].meal[j].dish[k].quantity = this.HealthAllData.tabDailyReport[i].meal[j].dish[k].quantity;
            this.HealthAllData.tabDailyReport[i + 1].meal[j].dish[k].unit = this.HealthAllData.tabDailyReport[i].meal[j].dish[k].unit;
            this.HealthAllData.tabDailyReport[i + 1].meal[j].dish[k].calFat.Calories = this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Calories;
            this.HealthAllData.tabDailyReport[i + 1].meal[j].dish[k].calFat.Cholesterol = this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Cholesterol;
            this.HealthAllData.tabDailyReport[i + 1].meal[j].dish[k].calFat.Name = this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Name;
            this.HealthAllData.tabDailyReport[i + 1].meal[j].dish[k].calFat.GlyIndex = this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.GlyIndex;
            this.HealthAllData.tabDailyReport[i + 1].meal[j].dish[k].calFat.Serving = this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Serving;
            this.HealthAllData.tabDailyReport[i + 1].meal[j].dish[k].calFat.ServingUnit = this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.ServingUnit;
            this.HealthAllData.tabDailyReport[i + 1].meal[j].dish[k].calFat.Sugar = this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Sugar;
            this.HealthAllData.tabDailyReport[i + 1].meal[j].dish[k].calFat.Fat.Saturated = this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Fat.Saturated;
            this.HealthAllData.tabDailyReport[i + 1].meal[j].dish[k].calFat.Fat.Total = this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Fat.Total;
            this.HealthAllData.tabDailyReport[i + 1].meal[j].dish[k].calFat.Carbs = this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Carbs;
            this.HealthAllData.tabDailyReport[i + 1].meal[j].dish[k].calFat.Protein = this.HealthAllData.tabDailyReport[i].meal[j].dish[k].calFat.Protein;
          }
        }
        this.theEvent.target.id = 'DelAllDate-' + i;
        this.DeleteDay(this.theEvent);
      }
    }
    this.isAllDataModified = true;
  }

  cleanFile() {
    for (var i = 0; i < this.HealthAllData.tabDailyReport.length; i++) {
      var trouve = false;
      if (this.HealthAllData.tabDailyReport[i].date.toString().length > 10) {
        if (this.HealthAllData.tabDailyReport[i].meal.length === 0) {
          trouve = true;
          this.HealthAllData.tabDailyReport.splice(i, 1);
          i--
        } else {
          this.TheSelectDisplays.controls['SelectedDate'].setValue(this.HealthAllData.tabDailyReport[i].date.toString().substring(0, 10));
          this.HealthAllData.tabDailyReport[i].date = this.TheSelectDisplays.controls['SelectedDate'].value;
        }

      }
      for (var j = 0; j < this.HealthAllData.tabDailyReport[i].meal.length && trouve === false; j++) {
        if (this.HealthAllData.tabDailyReport[i].meal[j].dish.length === 0 && this.HealthAllData.tabDailyReport[i].meal[j].name === "") {
          this.HealthAllData.tabDailyReport[i].meal.splice(j, 1);
          j--
        } else {
          for (var k = 0; k < this.HealthAllData.tabDailyReport[i].meal[j].dish.length; k++) {
            if (this.HealthAllData.tabDailyReport[i].meal[j].dish[k].name === "" && this.HealthAllData.tabDailyReport[i].meal[j].dish[k].quantity === 0) {
              this.HealthAllData.tabDailyReport[i].meal[j].dish.splice(k, 1);
              k--
            }
          }
        }
      }
    }
    this.tabNewRecordAll.splice(0, this.tabNewRecordAll.length);
    this.initTrackRecord();
    this.isAllDataModified = true;
  }

  GetRecord(Bucket: string, GoogleObject: string, iWait: number) {
    console.log('GetRecord - iWait='+iWait);
    this.EventHTTPReceived[iWait] = false;
    this.NbWaitHTTP++;
    if (iWait===0 || iWait===4){
      this.configServer.googleServer=this.saveServer.mongo;
    }
    this.waitHTTP(this.TabLoop[iWait], 3000, iWait);
    this.ManageGoogleService.getContentObject(this.configServer, Bucket, GoogleObject)
      .subscribe((data) => {
        console.log('GetRecord - data received for iWait='+iWait);
        var noPb=true;
        if (data.status!==undefined && data.status!==200){
          this.error_msg = data.msg;
          noPb=false;
        } else
        //JSON.stringify(data)
        if (iWait === 0) {
          console.log('file HealthAllData received');
          this.configServer.googleServer=this.saveServer.google;

          this.FillHealthAllInOut(this.HealthAllData,data);
  
          //this.HealthAllData=data;
          this.HealthAllData.tabDailyReport.sort((a, b) => (a.date > b.date) ? -1 : 1);
          if (this.HealthAllData.fileType === '') {
            this.HealthAllData.fileType = this.identification.fitness.fileType.Health;
          }
          if (this.InHealthAllData.fileType === '') {
            this.FillHealthAllInOut(this.InHealthAllData, this.HealthAllData);
          }
          this.resetBooleans();
          if (this.tabLock[0].lock === 1) {
            this.tabNewRecordAll.splice(0, this.tabNewRecordAll.length);
            this.initTrackRecord();
          }

          this.SpecificForm.controls['FileName'].setValue(this.identification.fitness.files.fileHealth);

        } else if (iWait === 1) {

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
          this.CreateDropDownCalFat();
        } else if (iWait === 2) {

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
          this.calculateHeight();
        }
        else if (iWait === 4) {
          this.configServer.googleServer=this.saveServer.google;

          this.ConfigChart.fileType = data.fileType;
          if (data.updatedAt !== undefined) {
            this.ConfigChart.updatedAt = data.updatedAt;
          } else {
            this.ConfigChart.updatedAt = '';
          }
          this.ConfigChart.chartHealth = data.chartHealth;
        }
        else if (iWait === 5) {
          this.fileParamChart.fileType = data.fileType;
          if (data.updatedAt !== undefined) {
            this.fileParamChart.updatedAt = data.updatedAt;
          } else {
            this.fileParamChart.updatedAt = '';
          }
          this.fileParamChart.data = data.data;


        } else if (iWait === 6) {
          this.fileRecipe.fileType = data.fileType;
          if (data.updatedAt !== undefined) {
            this.fileRecipe.updatedAt = data.updatedAt;
          } else {
            this.fileRecipe.updatedAt = '';
          }
          this.fileRecipe.tabCaloriesFat = data.tabCaloriesFat;
        } else if (iWait === 7) {
          if (this.tabLock[0].updatedAt >= data.updatedAt) {
            // file has not been updated by another user
            if (this.isMustSaveFile === true) {
              this.theEvent.target.id = 'All'; // ===== change value of target.id if created record or if selRecord
              this.ConfirmSave(this.theEvent);
            } else if (this.isSaveHealth === true) {
              this.ProcessSaveHealth(this.theEvent);
            } else if (this.tabLock[0].lock === 1 && this.isAllDataModified === true) {
              this.updateLockFile(0); // extend the timeout as no modification has been made by any other user after timeout
            }
          } else { // updates made by another user after timeout
            this.HealthAllData.tabDailyReport.splice(0, this.HealthAllData.tabDailyReport.length);
            this.FillHealthAllInOut(this.HealthAllData, data);
            this.tabLock[0].lock = 0;
            this.error_msg = 'TIMEOUT - Your updates are lost as in the meantime the file was updated by another user ';
            this.resetBooleans();
          }
        } else if (iWait === 8) {
          if (this.tabLock[5].updatedAt >= data.updatedAt) {
            // file has not been updated by another user
            if (this.isSaveParamChart === true) {
              this.ProcessSaveHealth(this.theEvent);
            } else if (this.tabLock[5].lock === 1) {
              this.updateLockFile(5); // extend the timeout as no modification has been made by any other user after timeout
            }
          } else { // updates made by another user after timeout
            this.fileParamChart.data.splice(0, this.fileParamChart.data.length);
            this.fileParamChart.data = data.data;
            this.tabLock[5].lock = 0;

          }
        } else if (iWait === 9) {
          if (this.tabLock[1].updatedAt >= data.updatedAt) {
            // file has not been updated by another user
            if (this.isSaveCaloriesFat === true) {
              this.processSaveCaloriesFat(this.saveEvent);
            } else if (this.tabLock[1].lock === 1) {
              this.updateLockFile(1); // extend the timeout as no modification has been made by any other user after timeout
            }
          } else { // updates made by another user after timeout
            this.ConfigCaloriesFat.tabCaloriesFat.splice(0, this.ConfigCaloriesFat.tabCaloriesFat.length);
            this.ConfigCaloriesFat.tabCaloriesFat = data.tabCaloriesFat;
            this.tabLock[1].lock = 0;

          }
        }
        if (noPb===true){
         
       
        if (iWait !== 7 && iWait !== 8 && iWait !== 9) {
          // this.returnFile.emit(data); // not needed as files are stored in cache of backend server
        }
        console.log('GetRecord - data processed for iWait='+iWait + '  EventHTTPReceived=true');
        this.EventHTTPReceived[iWait] = true;
        if (iWait===0){
          this.accessAllOtherFiles();
        }
        } 
      },
        error_handler => {
          //this.EventHTTPReceived[iWait] = true;
          if (iWait === 0) {
            this.error_msg = 'File ' + this.identification.fitness.files.fileHealth + ' does not exist. Create it';

          } else if (iWait === 1) {
            this.error_msg = 'File ' + this.identification.configFitness.files.calories + ' does not exist. Create it';

          }
        }
      )
  }


  calculateHealth(selRecord: DailyReport) {
    this.returnData = CalcFatCalories(this.ConfigCaloriesFat, selRecord, this.ConvertUnit);
    if (this.returnData.error > 0) {
      this.error_msg = this.returnData.error + ' nb of errors detected';
    }
  }


  fillAllData(inRecord: any, outRecord: any) {
    var i = 0;
    var j = 0;

    outRecord.date = inRecord.date;
    outRecord.burntCalories = inRecord.burntCalories;
    outRecord.total = inRecord.total;
    for (i = 0; i < inRecord.meal.length; i++) {
      const theMeal = new ClassMeal;
      outRecord.meal.push(theMeal);
      outRecord.meal[outRecord.meal.length - 1].name = inRecord.meal[i].name;
      outRecord.meal[outRecord.meal.length - 1].total = inRecord.meal[i].total;
      for (j = 0; j < inRecord.meal[i].dish.length; j++) {
        const theIngredient = new ClassDish;
        outRecord.meal[outRecord.meal.length - 1].dish.push(theIngredient);

        const iMeal = outRecord.meal.length - 1;
        outRecord.meal[iMeal].dish[outRecord.meal[iMeal].dish.length - 1] = inRecord.meal[i].dish[j];

      }
    }
  }

  delDate(event: any) {
    this.isDeleteConfirmed = true;
    this.manageIds(event.target.id);

    this.recordToDelete = this.TabOfId[0];
    const theDate = this.HealthAllData.tabDailyReport[this.recordToDelete].date;
    this.error_msg = 'confirm record#' + this.recordToDelete + ' with date=' + theDate + 'to be deleted';
    this.scroller.scrollToAnchor('ListAll');
  }

  ConfirmDelDate() {
    const theDate = this.HealthAllData.tabDailyReport[this.recordToDelete].date;
    this.HealthAllData.tabDailyReport.splice(this.recordToDelete, 1);
    this.error_msg = 'record#' + this.recordToDelete + ' with date=' + theDate + 'is deleted but file is not saved';
    this.errorFn = 'delDate';
    this.isDeleteConfirmed = false;
    this.isAllDataModified = true;

  }

  cancelDelDate() {
    this.isDeleteConfirmed = false;
  }

  CancelUpdateAll(event: any) {
    this.CancelSave()

  }

  isSaveParamChart: boolean = false;
  saveParamChart(event: any) {
    this.isSaveParamChart = true;
    this.fileParamChart.data = event;

    if (this.identification.triggerFileSystem === "No") {
      this.processSaveParamChart();
    } else {
      this.checkLockLimit(5, true, true);
    }

  }


  processSaveParamChart() {
    this.fileParamChart.fileType = this.identification.fitness.fileType.myChart;
    this.fileParamChart.updatedAt = strDateTime();
    // this.fileParamChart.data=event;
    this.SaveNewRecord(this.identification.fitness.bucket, this.identification.fitness.files.myChartConfig, this.fileParamChart, 5);
  }

  isSaveCaloriesFat: boolean = false;
  saveEvent: any;
  errCalcCalFat: string = '';
  calfatNameFile: string = '';
  SaveCaloriesFat(event: any) {
    this.isSaveCaloriesFat = true;
    this.saveEvent = event;
    if (event.fileType === undefined) {
      this.calfatNameFile = event;
    }
    if (this.identification.triggerFileSystem === "No") {
      this.processSaveCaloriesFat(event);
    } else {
      this.checkLockLimit(1, true, true);
    }


  }

  processSaveCaloriesFat(event: any) {
    // save this file
    // if (Array.isArray(event)===false){

    if (event.fileType === undefined) {
      //this.SpecificForm.controls['FileName'].setValue(event);
    } else if (event.tabCaloriesFat.length !== 0) {

      this.ConfigCaloriesFat.tabCaloriesFat.splice(0, this.ConfigCaloriesFat.tabCaloriesFat.length);
      for (var i = 0; i < event.tabCaloriesFat.length; i++) {
        const CalFatClass = new ClassCaloriesFat;
        this.ConfigCaloriesFat.tabCaloriesFat.push(CalFatClass);
        this.ConfigCaloriesFat.tabCaloriesFat[i].Type = this.saveEvent.tabCaloriesFat[i].Type;
        for (var j = 0; j < this.saveEvent.tabCaloriesFat[i].Content.length; j++) {
          const itemClass = new ClassItem;
          this.ConfigCaloriesFat.tabCaloriesFat[this.ConfigCaloriesFat.tabCaloriesFat.length - 1].Content.push(itemClass);
          this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j] = event.tabCaloriesFat[i].Content[j];
        }
      }



      // this.ConfigCaloriesFat=event;
      if (this.ConfigCaloriesFat.fileType === '') {
        this.ConfigCaloriesFat.fileType = this.identification.configFitness.fileType.calories;
      }
      this.ConfigCaloriesFat.updatedAt = strDateTime();
      // this.SaveNewRecord(this.identification.configFitness.bucket, this.SpecificForm.controls['FileName'].value, this.ConfigCaloriesFat, 1);
      this.SaveNewRecord(this.identification.configFitness.bucket, this.calfatNameFile, this.ConfigCaloriesFat, 1);
      /*
      if (event.fileType===''){
        event.fileType=this.identification.configFitness.fileType.calories;
      }
      event.updatedAt=strDateTime();
      
      this.SaveNewRecord(this.identification.configFitness.bucket, this.calfatNameFile, event, 1);
      */
      this.CreateDropDownCalFat();

    }
  }

  isSaveRecipeFile: boolean = false;
  recipeNameFile: string = '';
  SaveRecipeFile(event: any) {
    // save this file
    // if (Array.isArray(event)===false){
    if (event.fileType === undefined) {
      //this.SpecificForm.controls['FileName'].setValue(event);
      this.recipeNameFile = event;
    } else if (event.tabCaloriesFat.length !== 0) {
      this.fileRecipe.tabCaloriesFat.splice(0, this.fileRecipe.tabCaloriesFat.length);
      for (var i = 0; i < event.tabCaloriesFat.length; i++) {
        const CalFatClass = new ClassCaloriesFat;
        this.fileRecipe.tabCaloriesFat.push(CalFatClass);
        this.fileRecipe.tabCaloriesFat[i].Type = event.tabCaloriesFat[i].Type;
        this.fileRecipe.tabCaloriesFat[i].Total = event.tabCaloriesFat[i].Total;
        for (var j = 0; j < event.tabCaloriesFat[i].Content.length; j++) {
          const itemClass = new ClassItem;
          this.fileRecipe.tabCaloriesFat[this.fileRecipe.tabCaloriesFat.length - 1].Content.push(itemClass);
          this.fileRecipe.tabCaloriesFat[i].Content[j] = event.tabCaloriesFat[i].Content[j];
        }
      }

      if (this.fileRecipe.fileType === '') {
        this.fileRecipe.fileType = this.identification.fitness.fileType.recipe;
      }
      this.fileRecipe.updatedAt = strDateTime();
      // this.SaveNewRecord(this.identification.fitness.bucket, this.SpecificForm.controls['FileName'].value, this.fileRecipe, 6);
      this.SaveNewRecord(this.identification.fitness.bucket, this.recipeNameFile, this.fileRecipe, 6);

    }
  }
  isConfirmSaveA: boolean = false;

  ConfirmSaveA(event: any) {
    this.resetBooleans();
    this.theEvent.target.id = event.target.id;
    this.theEvent.target.value = event.target.value;
    this.theEvent.target.textContent = event.target.textContent;
    if (this.identification.triggerFileSystem === "No") {
      this.ConfirmSave(event);
    } else {
      if (this.isMustSaveFile === false) {
        this.isConfirmSaveA = true;
        this.checkLockLimit(0, true, false);
      } else if (this.tabLock[0].lock === 1) {
        this.ConfirmSave(event);
      }
    }

  }

  ConfirmSave(event: any) {
    this.theResetServer = false;
    if (this.tabLock[0].lock === 1) {
      this.isConfirmSaveA = false;
      this.SpecificForm.controls['FileName'].setValue(this.identification.fitness.files.fileHealth);
      this.error_msg = '';
      if (event.target.id.substring(0, 3) === 'Cre') {
        // CHECK THAT THERE IS NO DUPE FOR THE DATE 
        var i = 0;
        for (i = 0; i < this.HealthData.tabDailyReport.length && this.error_msg === ''; i++) {
          this.CheckDupeDate(this.HealthData.tabDailyReport[i].date);
        }
        if (this.error_msg === '') {
          this.IsSaveConfirmedCre = true;
          this.IsSaveConfirmedSel = false;
        } else {
          this.errorFn = 'Cre';
          this.IsSaveConfirmedCre = false;
          this.IsSaveConfirmedSel = false;
        }
      } else if (event.target.id.substring(0, 3) === 'Sel') {
        // CHECK THAT THERE IS NO DUPE FOR THE DATE 
        if (this.SelectedRecord.date !== this.TheSelectDisplays.controls['SelectedDate'].value) {
          this.CheckDupeDate(this.SelectedRecord.date);
        }
        if (this.error_msg === '') {
          this.IsSaveConfirmedCre = false;
          this.IsSaveConfirmedSel = true;
        } else {
          this.errorFn = 'Sel';
          this.IsSaveConfirmedCre = false;
          this.IsSaveConfirmedSel = false;
        }
      } else if (event.target.id.substring(0, 3) === 'All') {
        this.IsSaveConfirmedAll = true;
        this.errorFn = 'All';
      }
      this.theEvent.target.id = 'All';
    }

  }

  SaveCopy() {

    this.HealthAllData.tabDailyReport.sort((a, b) => (a.date > b.date) ? -1 : 1);
    if (this.HealthAllData.fileType !== '') {
      this.HealthAllData.fileType = this.identification.fitness.fileType.Health;
    }

    this.HealthAllData.updatedAt = strDateTime();

    this.SaveNewRecord(this.identification.fitness.bucket, this.SpecificForm.controls['FileName'].value, this.HealthAllData, -1);
    this.isCopyFile = false;
    this.TheSelectDisplays.controls['CopyFile'].setValue('N');
    this.errorFn = 'Copy';
  }

  CancelCopy() {
    this.isCopyFile = false;
    this.TheSelectDisplays.controls['CopyFile'].setValue('N');
    this.errorFn = '';
  }

  CancelRecord(event: any) {
    this.manageIds(event.target.id);
    this.isMustSaveFile = false;
    if (event.target.id.substring(0, 3) === 'Cre') {
      this.HealthData.tabDailyReport.splice(0, this.HealthData.tabDailyReport.length);
      this.theEvent.target.id = 'New';
      this.CreateDay(this.theEvent);
    } else if (event.target.id.substring(0, 3) === 'Sel') {
      this.SelectedRecord = new DailyReport;
      this.isSelectedDateFound = false;
      this.TheSelectDisplays.controls['SelectedDate'].setValue('');
      // this.fillAllData(this.HealthAllData.tabDailyReport[this.SelectedRecordNb], this.SelectedRecord);
    }
  }

  CancelSaveOthers(iWait: number) {
    if (iWait === 1) {
      this.isSaveCaloriesFat = false;
    } else if (iWait === 5) {
      this.isSaveParamChart = false;
    } else if (iWait === 6) {
      this.isSaveRecipeFile = false;
    }
  }

  CancelSave() {
    this.isMustSaveFile = false;
    this.tabInputMeal.splice(0, this.tabInputMeal.length);
    this.tabInputFood.splice(0, this.tabInputFood.length)
    this.HealthAllData.tabDailyReport.splice(0, this.HealthAllData.tabDailyReport.length)
    this.FillHealthAllInOut(this.HealthAllData, this.InHealthAllData);
    this.tabNewRecordAll.splice(0, this.tabNewRecordAll.length);
    this.initTrackRecord();
    this.IsSaveConfirmedCre = false;
    this.IsSaveConfirmedSel = false;
    this.IsSaveConfirmedAll = false;
    this.isAllDataModified = false;
    this.error_msg = '';
    this.errorFn = '';
  }


  isSaveHealth: boolean = false;
  SaveHealth(event: any) {
    this.error_msg = '';
    this.isSaveHealth = true;
    this.theEvent.target.id = event.target.id;
    if (this.identification.triggerFileSystem === "Yes") {
      this.checkLockLimit(0, true, true);
    } else {
      this.ProcessSaveHealth(event);
    }

  }

  ProcessSaveHealth(event: any) {
    this.error_msg = '';
    this.isSaveHealth = false;
    this.isMustSaveFile = false;
    this.errCalcCalFat = '';
    var trouve = false;
    var i = 0
    this.IsSaveConfirmedCre = false;
    this.IsSaveConfirmedSel = false;
    if (event.target.id.substring(0, 3) === 'Sel') {
      this.calculateHealth(this.SelectedRecord);
      if (this.error_msg !== '') {
        this.errCalcCalFat = 'errors found while caculating calories and fat';
      }
      this.SelectedRecord.total = this.returnData.outHealthData.total;
      this.SelectedRecord.meal = this.returnData.outHealthData.meal;
      this.SelectedRecord.burntCalories = this.returnData.outHealthData.burntCalories;
      if (this.SelectedRecord.date === this.TheSelectDisplays.controls['SelectedDate'].value) {
        this.HealthAllData.tabDailyReport.splice(this.SelectedRecordNb, 1);
      }
      this.errorFn = 'Sel';
      const theDaily = new DailyReport;
      this.HealthAllData.tabDailyReport.splice(this.SelectedRecordNb, 0, theDaily);
      this.fillAllData(this.SelectedRecord, this.HealthAllData.tabDailyReport[this.SelectedRecordNb]);
      this.SelectedRecord = new DailyReport;
      this.isSelectedDateFound = false;
      this.TheSelectDisplays.controls['SelectedDate'].setValue('');
      // insert the updated record of SelectedData

    } else if (event.target.id.substring(0, 3) === 'Cre') {
      this.errorFn = 'Cre';
      // insert the record at the end of HealthData
      for (i = 0; i < this.HealthData.tabDailyReport.length; i++) {
        const theDaily = new DailyReport;
        this.HealthAllData.tabDailyReport.push(theDaily);
        this.fillAllData(this.HealthData.tabDailyReport[i], this.HealthAllData.tabDailyReport[this.HealthAllData.tabDailyReport.length - 1]);
        this.calculateHealth(this.HealthData.tabDailyReport[i]);
        if (this.error_msg !== '') {
          this.errCalcCalFat = 'errors found while caculating calories and fat';
        }
        this.HealthData.tabDailyReport[i].total = this.returnData.outHealthData.total;
        this.HealthData.tabDailyReport[i].meal = this.returnData.outHealthData.meal;
      }
    } else if (event.target.id.substring(0, 3) === 'All') {
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
          if (this.error_msg !== '') {
            this.errCalcCalFat = 'errors found while caculating calories and fat';
            this.error_msg = "";
          }
          this.HealthAllData.tabDailyReport[i].total = this.returnData.outHealthData.total;
          this.HealthAllData.tabDailyReport[i].meal = this.returnData.outHealthData.meal;
        }
      }
    }

    this.HealthAllData.tabDailyReport.sort((a, b) => (a.date > b.date) ? -1 : 1);
    if (this.HealthAllData.fileType !== '') {
      this.HealthAllData.fileType = this.identification.fitness.fileType.Health;
    }
    // if (event.target.id.substring(0,3)==='All'){
    this.tabNewRecordAll.splice(0, this.tabNewRecordAll.length);
    this.initTrackRecord();
    //}

    //const aDate=new Date();
    //const theDate=aDate.toUTCString();
    //const stringDate=convertDate(aDate,'YYYYMMDD');
    //this.HealthAllData.updatedAt=stringDate + theDate.substring(17,19)+theDate.substring(20,22)+theDate.substring(23,25);

    this.HealthAllData.updatedAt = strDateTime();
    this.SaveNewRecord(this.identification.fitness.bucket, this.SpecificForm.controls['FileName'].value, this.HealthAllData, 0);
  }


  SaveNewRecord(GoogleBucket: string, GoogleObject: string, record: any, iWait: number) {
    this.error_msg = '';
    //var file=new File ([JSON.stringify(this.HealthAllData)],GoogleObject, {type: 'application/json'});
    var file = new File([JSON.stringify(record)], GoogleObject, { type: 'application/json' });
    if (GoogleObject === 'ConsoleLog.json') {
      const myTime = new Date();
      GoogleObject = 'ConsoleLog.json-' + myTime.toString().substring(4, 21);
      file = new File([JSON.stringify(this.myConsole)], GoogleObject, { type: 'application/json' });
    }
    this.ManageGoogleService.uploadObject(this.configServer, GoogleBucket, file, GoogleObject)
      .subscribe(res => {

        if (res.type === 4) {

          if (iWait === 0) {
            this.isAllDataModified = false;
          } else if (iWait === 1) {
            this.isSaveCaloriesFat = false;
          } else if (iWait === 5) {
            this.isSaveParamChart = false;
          } else if (iWait === 6) {
            this.isSaveRecipeFile = false;
          }
          //this.isAllDataModified=false;

          if ((iWait === 0 || iWait === 1 || iWait === 5 || iWait === 6) && this.identification.triggerFileSystem !== "No") {
            // update field 'updatedAt' in file system 
            this.updateLockFile(iWait);
          }
          this.isForceReset = true;
          this.tabLock[iWait].status = 0;
          if (iWait === 1 || iWait === 6) {
            this.saveCalFatMsg = 'File "' + GoogleObject + '" is successfully stored in the cloud';
          } else {
            this.error_msg = 'File "' + GoogleObject + '" is successfully stored in the cloud';
            // this.returnFile.emit(record); // not needed as files are stored in cache of backend server
          }
        }
      },
        error_handler => {
          //**this.LogMsgConsole('Individual Record is not updated: '+ this.Table_User_Data[this.identification.id].UserId );
          if (iWait === 1) {
            this.saveCalFatMsg = 'File "' + GoogleObject + '" *** Save action failed - status is ' + error_handler.status;
          } else {
            this.error_msg = 'File' + GoogleObject + '" *** Save action failed - status is ' + error_handler.status;
          }
        }
      )
  }

  saveCalFatMsg: string = "";

  waitHTTP(loop: number, max_loop: number, eventNb: number) {
    const pas = 500;
    if (loop % pas === 0) {
      console.log(eventNb + ' waitHTTP fn  ==> loop=' + loop + ' max_loop=' + max_loop);
    }
    loop++
    this.TabLoop[eventNb]++

    this.id_Animation[eventNb] = window.requestAnimationFrame(() => this.waitHTTP(loop, max_loop, eventNb));
    if (loop > max_loop || this.EventHTTPReceived[eventNb] === true) {
      
      console.log(eventNb + ' exit waitHTTP ==> TabLoop[eventNb]=' + this.TabLoop[eventNb] + ' eventNb=' + eventNb + ' this.EventHTTPReceived=' +
        this.EventHTTPReceived[eventNb]);
        window.cancelAnimationFrame(this.id_Animation[eventNb]);
      if (this.EventHTTPReceived[eventNb] === true) {
          window.cancelAnimationFrame(this.id_Animation[eventNb]);
      }
    }
  }

  LogMsgConsole(msg: string) {
    if (this.myConsole.length > 40) {
      this.SaveNewRecord('logconsole', 'ConsoleLog.json', this.myLogConsole, -1);
      this.message = 'Saving of LogConsole';
    }
    this.SaveConsoleFinished = false;

    this.myLogConsole = true;
    msginLogConsole(msg, this.myConsole, this.myLogConsole, this.SaveConsoleFinished, this.HTTP_Address, this.type);

  }


  SelRadio(event: any) {
    // this.checkLockLimit(0);
    this.theResetServer = false;
    const i = event.substring(2);
    this.error_msg = '';
    const NoYes = event.substring(0, 1);
    if (i === '1') {
      if (NoYes === 'Y') {
        this.isCreateNew = true;

        if (this.tabLock[0].lock !== 1) {
          this.lockFile(0);
        }
      } else {
        this.isCreateNew = false;
        if (this.tabLock[0].lock === 1 && this.isDisplaySpecific === false && this.isDisplayAll === false) {
          this.unlockFile(0);
        }
      }
    } else if (i === '2') {
      if (NoYes === 'Y') {
        this.isDisplaySpecific = true;
        if (this.tabLock[0].lock !== 1) {
          this.lockFile(0);
        }
      } else {
        this.isDisplaySpecific = false;
        if (this.tabLock[0].lock === 1 && this.isCreateNew === false && this.isDisplayAll === false) {
          this.unlockFile(0);
        }
      }
    } else if (i === '3') {
      if (NoYes === 'Y') {
        this.dialogue[this.prevDialogue] = false;
        this.isDisplayAll = true;
        if (this.tabLock[0].lock !== 1) {
          this.lockFile(0);
        }
      } else {
        if (this.tabLock[0].lock === 1 && this.isCreateNew === false && this.isDisplaySpecific === false) {
          this.unlockFile(0);
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
          this.lockFile(1);
        }
      } else {
        this.isMgtCaloriesFat = false;
        if (this.tabLock[1].lock === 1) {
          this.unlockFile(1);
        }

      }
    } else if (i === '6') {
      if (NoYes === 'Y') {
        if (this.tabLock[0].lock !== 1) {
          this.lockFile(0);
        }
        this.errCalcCalFat = '';
        for (var j = 0; j < this.HealthAllData.tabDailyReport.length; j++) {
          this.calculateHealth(this.HealthAllData.tabDailyReport[j]);
          if (this.error_msg !== '') {
            this.errCalcCalFat = 'errors found while caculating calories and fat';
          }
          this.HealthAllData.tabDailyReport[j].total = this.returnData.outHealthData.total;
          this.HealthAllData.tabDailyReport[j].meal = this.returnData.outHealthData.meal;
        }
        this.IsCalculateCalories = true;
        this.isAllDataModified = true;
        //this.tabNewRecordAll.splice(0,this.tabNewRecordAll.length);
        //this.initTrackRecord();
      }
    } else if (i === '8') {
      if (NoYes === 'Y') { // HTML file reload file
        this.GetRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.confHTML, 3);
      }
    } else if (i === '7') {
      if (NoYes === 'Y') {
        if (this.EventHTTPReceived[4] === false) {
          this.getChartFiles();
        }
        this.isDisplayChart = true;
        if (this.tabLock[5].lock !== 1) {
          this.lockFile(5);
        }
      }
      else {
        this.isDisplayChart = false;
        if (this.tabLock[5].lock === 1) {
          this.unlockFile(5);
        }
      }
    } else if (i === '9') {
      if (NoYes === 'Y') { // reload confirguration chart
        this.GetRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.confChart, 4);
        if (this.tabLock[4].lock !== 1) {
          this.lockFile(4);
        }
      }
      else {
        if (this.tabLock[4].lock === 1) {
          this.unlockFile(4);
        }
      }
    }
  }

  @HostListener('window:unload', ['$event'])
  unloadHandler(event: any) {
    this.ngOnDestroy();
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: any) {
    this.ngOnDestroy();
  }
  processDestroy: boolean = false;
  passDestroy: number = 0;
  ngOnDestroy() {
    this.theResetServer = false;
    this.passDestroy++
    console.log('trigger ngOnDestroy  === pass=' + this.passDestroy);
    if (this.processDestroy === false) {
      this.processDestroy = true;
      var trouve = false;
      for (var i = 0; i < this.tabLock.length && trouve === false; i++) {
        if (this.tabLock[i].lock === 1) {
          trouve = true;
          this.tabLock[0].action = 'onDestroy';
          this.onFileSystem(0);
        }
      }
    }
  }

  unlockFile(iWait: number) {
    this.tabLock[iWait].action = 'unlock';
    // this.updateSystemFile(iWait);
    this.onFileSystem(iWait);
  }

  lockFile(iWait: number) {
    console.log('=== lockFile ' + this.tabLock[iWait].objectName)
    this.tabLock[iWait].action = 'lock';
    // this.updateSystemFile(iWait);
    this.onFileSystem(iWait);
  }
  checkFile(iWait: number) {
    this.tabLock[iWait].action = 'check';
    // this.updateSystemFile(iWait);
    this.onFileSystem(iWait);
  }

  async checkUpdateFile(iWait: number) {
    this.tabLock[iWait].action = 'check&update';
    // this.updateSystemFile(iWait);
    this.onFileSystem(iWait);
  }

  updateLockFile(iWait: number) {
    this.tabLock[iWait].action = 'updatedAt';
    // this.updateSystemFile(iWait);
    this.onFileSystem(iWait);
  }

  iWaitSave: number = 0;
  onFileSystem(iWait: number) {
    this.error_msg = '';
    var theAction = this.tabLock[iWait].action;
    this.iWaitSave = iWait;
    this.tabLock[iWait].status = 0;
    if (this.identification.triggerFileSystem === "No") {
      this.tabLock[iWait].lock = 1;
      this.tabLock[iWait].action = "";
    } else {

      this.ManageGoogleService.onFileSystem(this.configServer, this.configServer.bucketFileSystem, 'fileSystem', this.tabLock, iWait.toString())
        .subscribe(
          data => {
            if (theAction === 'onDestroy') {
              // console.log('onDestroy ==> '+ JSON.stringify(data));
              this.tabLock[iWait].status = 0;
            } else {
              this.returnOnFileSystem(data, iWait);
            }

          },
          err => {
            if (theAction === 'onDestroy') {
              if (err.status === 900) {
                // destroy is fine
              } else {
                console.log('Google updateFileSystem general error=' + err.status + '  specific error= ' + err.error.error + ' & message= ' + err.error.message);
                this.error_msg = this.error_msg + '   update FileSystem =' + err.status + '  specific error= ' + err.error.error + ' & message= ' + err.error.message;
              }
            } else {
              this.returnOnFileSystem(err, iWait);
            }
          })
    }
  }


  nbRecall: number = 0;



  theResetServer: boolean = false;
  returnOnFileSystem(data: any, iWait: number) {
    //this.isTriggerFileSystem=false;
    //const iWait=this.saveIWait;
    this.error_msg = '';
    if (data.status !== undefined && data.status === 200 && data.tabLock !== undefined) { // tabLock is returned
      console.log('server response: ' + data.tabLock[iWait].object + ' createdAt=' + data.tabLock[iWait].createdAt + '  & updatedAt=' + data.tabLock[iWait].updatedAt + '  & lock value =' + data.tabLock[iWait].lock);
      if (data.tabLock[iWait].credentialDate !== this.credentialsFS.creationDate) { // server was reinitialised
        this.tabLock[iWait] = data.tabLock[iWait];
        if (this.configServer.googleServer===this.configServer.fileSystemServer){
          this.getDefaultCredentials(iWait, false); // update credentials only 
        }
      }
      // record is locked by another user; no actions can take place for this user so reset
      this.nbCallCredentials = 0;
      if (data.tabLock[iWait].createdAt !== undefined) {
        this.error_msg = this.error_msg + " data returned on file " + data.tabLock[iWait].objectName + " ==> action = " + data.tabLock[iWait].action + '  lock = ' + data.tabLock[iWait].lock + "  & status = " + data.tabLock[iWait].status;
        console.log(this.error_msg);
        if (this.tabLock[iWait].action === 'unlock') {
          this.tabLock[iWait].lock = 3;
          this.onInputAction = "";
          this.tabLock[iWait].createdAt = "";
          this.tabLock[iWait].updatedAt = "";

        }
        else if (data.tabLock[iWait].lock === 1 && this.tabLock[iWait].lock === 2) {
          // file is now locked for this user; need to retrieve the file to ensure we have the latest version
          this.tabLock[iWait] = data.tabLock[iWait];
          this.onInputAction = "";
          if (iWait === 0) {
            this.reAccessHealthFile();
          } else if (iWait === 1) {
            this.reAccessConfigCal();
          } else if (iWait === 5) {
            this.tabLock[iWait].status = data.status.tabLockItem;
            this.reAccessChartFile();
          }


        } else if (data.tabLock[iWait].lock === 2 && this.tabLock[iWait].lock === 1) {
          // file is now locked by another user
          this.tabLock[iWait].lock = data.tabLock[iWait];;
          if (iWait === 0) {
            this.reAccessHealthFile();
          } else {
            this.tabLock[iWait].status = 300;
            if (iWait === 5) {
              this.reAccessChartFile();
            } else if (iWait === 1) {
              this.reAccessConfigCal();
            }
          }

        } else {
          this.tabLock[iWait] = data.tabLock[iWait];
          if (data.tabLock[iWait].lock === 1 && this.onInputAction === "onInputDailyAll") {
            this.onInputAction = "";
            this.onInputDailyAllA(this.theEvent);
          } else if (data.tabLock[iWait].lock === 1 && this.onInputAction === "onAction") {
            this.onInputAction = "";
            this.onActionA(this.theEvent);
          } else if (this.tabLock[iWait].action === 'check&update' && data.tabLock[iWait].status === 0 && this.isMustSaveFile === true) {
            this.ConfirmSave(this.theEvent);
          } else if (data.tabLock[iWait].lock === 1 && this.onInputAction === "onInputDaily") {
            this.onInputAction = "";
            this.onInputDailyA(this.theEvent);
          } else {
            console.log('File is locked; no specific action; process continues');
            this.onInputAction = "";
          }
        }
      }

    } else if (data.status !== undefined && data.status.tabLockItem !== undefined && (this.tabLock[iWait].action === 'check' || this.tabLock[iWait].action === 'check&update') && data.status.tabLockItem.createdAt !== undefined) { // tabLock[iWait] is returned

      if (data.status.tabLockItem.status === 810 || data.status.tabLockItem.status === 800) { // record found and belongs to same user or record not found or file empty
        this.nbCallCredentials = 0;
        if (data.status.tabLockItem.status === 800) { // no file system or no record then lock this user
          this.lockFile(iWait); // ====> the process below has to be reviewed 
        }
        this.tabLock[iWait].status = data.status.tabLockItem;
        if (this.onInputAction === "onAction") {
          this.onInputAction = "";
          this.onActionA(this.theEvent);
        } else if (this.onInputAction === "onInputDailyAll") {
          this.onInputAction = "";
          this.onInputDailyAllA(this.theEvent);
        } else if (this.onInputAction === "onInputDaily") {
          this.onInputAction = "";
          this.onInputDailyA(this.theEvent);
        }
        if (iWait === 0) {
          if (this.isSaveHealth === true) {
            this.ProcessSaveHealth(this.theEvent);
          } else if (this.isMustSaveFile === true) {
            this.ConfirmSave(this.theEvent);
          } else if (data.status === 810) {
            this.updateLockFile(iWait);
          }
        } else if (iWait === 1) {
          if (this.isSaveCaloriesFat === true) {
            this.processSaveCaloriesFat(this.saveEvent);
          } else if (data.status === 810) {
            this.updateLockFile(iWait);
          }
        } else if (iWait === 5) {
          if (this.isSaveParamChart === true) {
            this.processSaveParamChart();
          } else if (data.status === 810) {
            this.updateLockFile(iWait);
          }
        }

      } else if (data.status.tabLockItem.status === 820) { // record found and belongs to other user
        this.nbCallCredentials = 0;
        this.tabLock[iWait].lock = 2;
        this.onInputAction = "";
        if (iWait === 0) {
          this.reAccessHealthFile();
        } else if (iWait === 1) {
          this.reAccessConfigCal();
        } else if (iWait === 5) {
          this.tabLock[iWait].status = data.status.tabLockItem;
          this.reAccessChartFile();
        }

      }

    } else if (data.status !== undefined) {

      if (data.status === 300 || data.status === 720) { // 300 record already locked; 720 updatedAt on record locked by another user
        this.nbCallCredentials = 0;
        this.tabLock[iWait].lock = 2;
        this.onInputAction = "";
        if (data.status === 720) {
          this.tabLock[iWait].status = 720;
          if (iWait === 0) {
            this.reAccessHealthFile();
          } else if (iWait === 1) {
            this.reAccessConfigCal();
          } else if (iWait === 5) {
            this.reAccessChartFile();
          }
        } else {
          this.tabLock[iWait].status = 300;
        }
      } else if (data.status === 700 || data.status === 710) { // requested to unlock record which does not exist or is locked by another user
        this.nbCallCredentials = 0;
        this.nbCallCredentials = 0;
        this.tabLock[iWait].lock = 0;
        this.tabLock[iWait].status = data.status;
        this.onInputAction = "";

      } else if (data.status === 666) {
        console.log("server cannot process file system because is processed by another user; try once more in 2 seconds");
        this.nbRecall++;
        this.nbCallCredentials = 0;
        var theDate = new Date();
        var seconds = theDate.getUTCSeconds();
        var myRefTime = seconds + 2; // wait 2 seconds
        if (myRefTime > 60) {
          myRefTime = myRefTime - 60;
        }
        while (seconds < myRefTime) {
          theDate = new Date();
          seconds = theDate.getUTCSeconds();
        }
        console.log('try again onFileSystem');
        if (this.nbRecall < 5) {
          this.onFileSystem(iWait);
        } else {
          this.nbRecall = 0;
          if (this.tabLock[iWait].action === 'lock') {
            this.tabLock[iWait].lock = 2;
          }
        }
      } else if (data.status === 955) {
        this.error_msg = this.error_msg + data.msg;
        this.theResetServer = true;
        this.tabLock[iWait].lock = 3;

        this.getDefaultCredentials(iWait, true); // update credentials & check File.updatedAt 

      } else if (data.status === 956) {  // record is locked by another user
        this.error_msg = this.error_msg + data.msg;
        this.theResetServer = true;
        this.tabLock[iWait].lock = 3;
        this.onInputAction = "";
        this.tabLock[iWait].status = 720;
        if (iWait === 0) {
          this.reAccessHealthFile();
        } else if (iWait === 1) {
          this.reAccessConfigCal();
        } else if (iWait === 5) {
          this.reAccessChartFile();
        }
        if (this.configServer.googleServer===this.configServer.fileSystemServer){
          this.getDefaultCredentials(iWait, false); // update credentials only 
        }
      } else {

        this.nbCallCredentials = 0;

        this.onInputAction = "";

        if (this.tabLock[iWait].action === 'lock' || this.tabLock[iWait].action === "unlock") {

          this.tabLock[iWait].status = 0;
          if (this.tabLock[iWait].action === 'lock') {
            this.tabLock[iWait].lock = 2;
            console.log('which type of data is it????' + JSON.stringify(data) + '  on action ' + + this.tabLock[iWait].action);
          } else {
            this.tabLock[iWait].lock = 3;
          }
        } else {
          this.tabLock[iWait].status = 999;
          console.log('which type of data is it????' + JSON.stringify(data) + '  on action ' + + this.tabLock[iWait].action);
        }

      }

    } else {
      console.log('which type of data is it???? : ' + JSON.stringify(data));
      this.tabLock[iWait].status = 999;
      if (this.tabLock[iWait].action === 'lock') {
        this.tabLock[iWait].lock = 2;
      }
    }
  }


  msgCredentials: string = '';
  nbCallCredentials: number = 0;
  getDefaultCredentials(iWait: number, checkFile: boolean) {
    console.log('getDefaultCredentials()');
    var newCredentials = new classCredentials;
    this.ManageGoogleService.getDefaultCredentials(this.configServer)
      .subscribe(
        (data) => {
          newCredentials.access_token = data.credentials.access_token;
          newCredentials.id_token = data.credentials.id_token
          newCredentials.refresh_token = data.credentials.refresh_token
          newCredentials.token_type = data.credentials.token_type;
          newCredentials.userServerId = this.tabLock[iWait].userServerId;
          newCredentials.creationDate = data.credentials.creationDate;
          this.identification.userServerId = this.tabLock[iWait].userServerId;
          this.identification.credentialDate = data.credentials.creationDate;
          // this.getInfoToken(); // this is a test
          this.error_msg = this.error_msg + " Server has been reinitialised and credentials updated";
          this.newCredentials.emit(newCredentials);
          for (var i = 0; i < 7; i++) {
            this.tabLock[i].userServerId = this.identification.userServerId;
            this.tabLock[i].credentialDate = this.identification.credentialDate;
            //this.tabLock[i].createdAt='';
            //this.tabLock[i].updatedAt='';
          }
          this.theResetServer = true;
          //this.msgCredentials='';
          if (checkFile === true) {
            // check whether the last update was performed by the same user
            this.ManageGoogleService.getContentObject(this.configServer, this.tabLock[iWait].bucket, this.tabLock[iWait].object)
              .subscribe((data) => {

                if ((iWait === 0 && this.HealthAllData.updatedAt === data.updatedAt) || (iWait === 1 && this.ConfigCaloriesFat.updatedAt === data.updatedAt)
                  || (iWait === 1 && this.fileParamChart.updatedAt === data.updatedAt)) {
                  // this means that current user was the one who updated the file
                  if (this.nbCallCredentials === 0) {
                    this.nbCallCredentials++
                    this.onFileSystem(iWait);
                  } else {
                    this.nbCallCredentials = 0;
                    this.msgCredentials = 'Server has been reinitialised - file is retrieved';
                    this.error_msg = this.error_msg + this.msgCredentials;
                    console.log(this.msgCredentials);
                    if (iWait === 0) {
                      this.reAccessHealthFile();
                    } else if (iWait === 1) {
                      this.reAccessConfigCal();
                    } else if (iWait === 5) {
                      this.reAccessChartFile();
                    }
                  }
                } else {
                  this.msgCredentials = 'Server has been reinitialised - file is retrieved';
                  console.log(this.msgCredentials);
                  this.error_msg = this.error_msg + this.msgCredentials;
                  if (iWait === 0) {
                    this.reAccessHealthFile();
                  } else if (iWait === 1) {
                    this.reAccessConfigCal();
                  } else if (iWait === 5) {
                    this.reAccessChartFile();
                  }
                }
              },
                err => {
                  this.msgCredentials = 'PB with Server which was reinitialised - relaunch the application';
                  console.log(this.msgCredentials);
                  this.error_msg = this.error_msg + this.msgCredentials;
                  this.resetServer.emit('Google');
                }
              )

          }
        },
        err => {
          console.log('return from requestToken() with error = ' + JSON.stringify(err));
          this.msgCredentials = 'problem to retrieve credentials data ==>   ' + JSON.stringify(err);
          this.error_msg = this.error_msg + this.msgCredentials;
          //this.resetServer.emit('Google');
        });
  }


  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const j = changes[propName];
      
        if (propName === 'credentials' && changes['credentials'].firstChange === false) {
          console.log('health component : credentials related to Google server have been updated');
        } else if (propName === 'credentialsMongo' && changes['credentialsMongo'].firstChange === false) {
          console.log('health component : credentials related to Mongo server have been updated');
        } else if (propName === 'credentialsFS' && changes['credentialsFS'].firstChange === false) {
          console.log('health component : credentials related toFile System server have been updated');
        }
      
    }
  }

  getChartFiles() {
    if (this.InConfigChart.fileType === '') {
      this.GetRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.confChart, 4);
    } else {
      this.ConfigChart = this.InConfigChart;
      this.EventHTTPReceived[4] = true;
    }

    if (this.fileParamChart.fileType === '') {
      this.GetRecord(this.identification.fitness.bucket, this.identification.fitness.files.myChartConfig, 5);
    } else {
      this.fileParamChart = this.InFileParamChart;
      this.EventHTTPReceived[5] = true;
    }

  }

  reAccessHealthFile() {
    console.log('reAccessHealthFile');
    this.HealthAllData.tabDailyReport.splice(0, this.HealthAllData.tabDailyReport.length);
    this.GetRecord(this.identification.fitness.bucket, this.identification.fitness.files.fileHealth, 0);
  }

  reAccessChartFile() {
    this.fileParamChart.data.splice(this.fileParamChart.data.length);
    this.GetRecord(this.identification.fitness.bucket, this.identification.fitness.files.myChartConfig, 5);
  }

  reAccessConfigCal() {
    this.ConfigCaloriesFat.tabCaloriesFat.splice(this.ConfigCaloriesFat.tabCaloriesFat.length);
    this.GetRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.calories, 1);
  }



}

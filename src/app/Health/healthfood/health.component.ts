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
import { classFileSystem, classAccessFile , classReturnDataFS, classHeaderReturnDataFS , classRetrieveFile} from '../../classFileSystem';

import { ManageMongoDBService } from '../../CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from '../../CloudServices/ManageGoogle.service';
import { AccessConfigService } from '../../CloudServices/access-config.service';
import { fillHealthOneDay } from '../../copyFilesFunction';
import { fnAddTime, convertDate, strDateTime, fnCheckTimeOut, defineMyDate, formatDateInSeconds, formatDateInMilliSeconds, findIds } from '../../MyStdFunctions';
import { drawNumbers, drawHourHand, drawMinuteHand, drawSecondHand, classPosSizeClock} from '../../clockFunctions'

@Component({
  selector: 'app-health',
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.css']
})
export class HealthComponent  {

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string,
  ) { }

  @Output() initTrackRecord = new EventEmitter<any>();
  @Output() retrieveRecord = new EventEmitter<any>();

  @Output() checkLockLimit = new EventEmitter<any>();
  @Output() cancelUpdates = new EventEmitter<any>();
  @Output() processSaveHealth = new EventEmitter<any>();
  @Output() unlockFile = new EventEmitter<any>();

  @Input() configServer = new configServer;
  @Input() identification = new LoginIdentif;

  @Input() returnDataFSHealth = new classHeaderReturnDataFS;
  @Input() resultCheckLimitHealth:number =0;
  @Input() callSaveFunction:number =0;
  @Input() statusSaveFn:any;

  @Input() HealthAllData = new mainDailyReport;
  @Input() ConfigCaloriesFat = new mainClassCaloriesFat;

  @Input() confTableAll = new classConfTableAll;
  @Input() tabLock: Array<classAccessFile> = []; //0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked;
  
  iWaitToRetrieve:Array<classRetrieveFile>=[];
  @Input() tabNewRecordAll: Array<any> = [
    {
      nb: 0,
      meal: [{
        nb: 0,
        food: [{ nb: 0}]
      }]
    }
  ];

  @Input() actionHealth:number=0;
  @Input() createDropDownCalFat:number=0;

  @Input() triggerCheckToLimit:number=8000;

  secondaryLevelFn:boolean=true;

  lockValueBeforeCheck:number=0;

  //openFileAccess:boolean=false;

  myLogConsole: boolean = false;
  myConsole: Array<msgConsole> = [];
  returnConsole: Array<msgConsole> = [];
  SaveConsoleFinished: boolean = false;
  type: string = '';

  errorMsg: string = '';

  SpecificForm = new FormGroup({
    FileName: new FormControl('', { nonNullable: true }),
  })

  isConfirmSaveA:boolean=false;
  isCopyFile: boolean = false;
  isDeleteConfirmed: boolean = false;
  isAllDataModified: boolean = false;
  IsSaveConfirmedAll: boolean = false;
  isDeleteItem: boolean = false;

  isInputFood: boolean = false;
  strInputFood: string = "";

  isForceReset: boolean = false;

  errorFn: string = '';

  recordToDelete: number = 0;
 
  TabAction: Array<any> = [{ name: '' }];
  NewTabAction: Array<any> = [{ type: '', name: '' }];

  theEvent = new classtheEvent;

  TabOfId: Array<any> = [];

  dateRangeStart = new Date();
  dateRangeEnd = new Date();
  dateRangeStartHealth = new Date();
  dateRangeEndHealth = new Date();

  getScreenWidth: any;
  getScreenHeight: any;
  device_type: string = '';

  filterHealth: boolean = false;

  searchOneDate: number = 0;
  searchOneDateHealth: number = 0;
  isRangeDateError: boolean = false;

  prevDialogue: number = 0;
  dialogue: Array<boolean> = [false, false, false, false, false, false, false]; // CREdate=0; CREmeal=1; CREingr=2; SELdate=3; SELmeal=4; SELingr=5; allData=6
  
  onInputAction: string = '';
  myAction: string = '';
  myType: string = '';

  tabMeal: Array<any> = [{ name: '' }];
  tabFood: Array<any> = [{ name: '' }];
  tabInputMeal: Array<any> = [];
  tabInputFood: Array<any> = [];

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

  offsetHeight: number = 0;
  offsetLeft: number = 0;
  offsetTop: number = 0;
  offsetWidth: number = 0;
  scrollHeight: number = 0;
  scrollTop: number = 0;

  posDelConfirm: number = 0;
  posDelDate = 330;
  posDelMeal = 410;
  posDelIngr = 480;
  delMsg: string = '';

  posDivCalFat = new classPosDiv;
  posDivReportHealth = new classPosDiv;
  posDivAfterTitle = new classPosDiv;

  titleHeight: number = 0;
  foodPos: number = 0;
  posItem: number = 0;
  eventClientY: number = 0;

  lastInputAt: string = '';

  isMustSaveFile: boolean = false;
  isSaveHealth: boolean = false;

  errCalcCalFat: string = '';

  posSizeClock=new classPosSizeClock;

  maxItemsPerPage:number=30;
  numPage:number=1;
  displayHealthAllData = new mainDailyReport;
  minNum:number=0;
  maxNum:number=0;

  userActivity:string= "";

  TheSelectDisplays: FormGroup = new FormGroup({
    SelectedDate: new FormControl(Date(), { nonNullable: true }),
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


  findPosItem(sizeBox: any) {
    this.foodPos = Math.trunc(Number(this.eventClientY) - Number(this.posDivAfterTitle.ClientRect.Top) - Number(this.titleHeight)) ;
    this.posItem =  this.foodPos - Number(sizeBox) / 2 + 10;
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
  }

  pageNext(){
    if (this.maxItemsPerPage * this.numPage < this.HealthAllData.tabDailyReport.length){
      this.numPage ++
    }
    this.minNum = (this.numPage-1) * this.maxItemsPerPage;
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

    this.minNum = 0 ;
    this.maxNum = this.maxItemsPerPage;
    
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


    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
    this.device_type = navigator.userAgent;
    this.device_type = this.device_type.substring(10, 48);

    this.TheSelectDisplays.controls['startRange'].setValue('');
    this.TheSelectDisplays.controls['endRange'].setValue('');

    this.posSizeClock.margLeft = 840;
    this.posSizeClock.margTop = -20;
    this.posSizeClock.width = 60;
    this.posSizeClock.height = 60;
    this.posSizeClock.displayAnalog = false;
    this.posSizeClock.displayDigital = true;


    //this.configServer.timeoutFileSystem.userTimeOut.mn=2;
    console.log('ngInit() calls this.timeToGo() => userActivity=' + this.userActivity.substring(0,14));
    //this.userActivity = defineMyDate();
    this.lastInputAt = strDateTime();
    this.refDate=new Date();
    this.callTimeToGo();
  }

  isUserTimeOut:boolean=false;


  timeOutactivity(iWait: number, isDataModified: boolean, isSaveFile: boolean,theAction:string){
    console.log('Health component - timeOutactivity');
    window.cancelAnimationFrame(this.idAnimation);
    this.callTimeToGo();
    this.refDate=new Date();
    this.lastInputAt = strDateTime();

    if (theAction==="only"){
      //this.openFileAccess=true;
      this.theEvent.checkLock.action='checkTO';
      this.theEvent.checkLock.iWait=iWait;
      this.theEvent.checkLock.isDataModified=isDataModified;
      this.theEvent.checkLock.isSaveFile=isSaveFile;
      this.theEvent.checkLock.iCheck=true;
      this.theEvent.checkLock.lastInputAt=this.lastInputAt;
      this.theEvent.checkLock.nbCalls++;
      this.triggerCheckToLimit++
      this.lockValueBeforeCheck=this.tabLock[0].lock;
      //this.checkLockLimit.emit({iWait:iWait,isDataModified:isDataModified,isSaveFile:isSaveFile, lastInputAt:this.lastInputAt, iCheck:true,nbCalls:0,action:theAction});
    }
  }

  refDate=new Date();
  displaySec:number=0;
  displayMin:number=0;
  displayHour:number=0;
  idAnimation:any;


  callTimeToGo(){
    const currSeconds=this.refDate.getSeconds() ;
    const currMinutes=this.refDate.getMinutes();
    const currHour=this.refDate.getHours();
    const currentDateSec = currHour*3600+currMinutes*60+currSeconds;
    this.timeToGo(currentDateSec,this.configServer.timeoutFileSystem.userTimeOut.hh * 3600 +this.configServer.timeoutFileSystem.userTimeOut.mn * 60 + this.configServer.timeoutFileSystem.userTimeOut.ss);
    
  }

  timeToGo(refDateSec:any, timeOutSec:any){
    // nb of seconds before timeout is reached
    const theDate=new Date();
    const currentDateSec = theDate.getHours()*3600+theDate.getMinutes()*60+theDate.getSeconds();
    const timeSpent = Number(currentDateSec) - Number(refDateSec);
    const timeLeft= timeOutSec - timeSpent;
    if (timeLeft <= 0 && this.isAllDataModified===true){
        this.errorMsg = "your modifications are going to be lost if you don't save them";
        /*
        window.cancelAnimationFrame(this.idAnimation);
        this.isUserTimeOut=true;
        this.unlockFile.emit(0);
        this.isForceReset === true;
        this.resetBooleans();
        */
    } else {
        this.displayHour = Math.floor(timeLeft / 3600);
        const minSec = timeLeft % 3600 ;
        this.displayMin = Math.floor(minSec / 60);
        this.displaySec = minSec % 60 ;
        this.idAnimation=window.requestAnimationFrame(() => this.timeToGo(refDateSec,timeOutSec));
    }
  }

  resultAccessFile(event:any){
    console.log('Health component - resultAccessFile');
    if (this.lockValueBeforeCheck!==this.tabLock[0].lock){
      if (this.tabLock[0].lock===1){
        this.errorMsg = "You can now update the file";
      } else {
        this.errorMsg = "File is locked by another user";
      }
    }
    if (this.returnDataFSHealth.errorCode!==0 && this.returnDataFSHealth.errorCode!==200){
      this.errorMsg = this.returnDataFSHealth.errorMsg;
    } 
    else  if (this.tabLock[0].lock === 1 && this.onInputAction === "onInputDailyAll") {
      this.onInputDailyAllA(this.theEvent);
      this.onInputAction="";
    } else if (this.tabLock[0].lock===1 && this.onInputAction === "onAction") {
      this.onActionA(this.theEvent);
      this.onInputAction="";
    } else if (this.onInputAction === "confirmSave"){
      this.SpecificForm.controls['FileName'].setValue(this.identification.fitness.files.fileHealth);
      this.IsSaveConfirmedAll = true;
    }
    console.log(event);
  }

  resetBooleans() {
    console.log('Health component - resetBooleans');
    this.isDeleteItem = false;
    this.dialogue[this.prevDialogue] = false;
    this.tabInputMeal.splice(0, this.tabInputMeal.length);
    this.isInputFood = false;
    this.isSaveHealth=false;
    if (this.tabLock[0].lock !== 1 || this.isForceReset === true) {
      this.isDeleteConfirmed = false;
      this.IsSaveConfirmedAll = false;
      this.isAllDataModified = false;
      if (this.isUserTimeOut===false){
        this.tabNewRecordAll.splice(0, this.tabNewRecordAll.length);
        this.initTrackRecord.emit();
      }
      this.isMustSaveFile = false;
      //this.isSaveHealth = false;
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
    this.timeOutactivity(0, this.isAllDataModified, this.isSaveHealth,"only");
    this.resetBooleans();
    if (event.currentTarget.id === 'search' && event.currentTarget.value !== '') {
      this.checkText = event.currentTarget.value.toLowerCase().trim();
    } else {
      this.checkText = '';
    }
  }

  actionSearchText(event: any) {
    this.timeOutactivity(0, this.isAllDataModified, this.isSaveHealth,"only");
    this.resetBooleans();
    if (event.target.id === 'submit'){
      this.checkText = this.TheSelectDisplays.controls['searchString'].value;
    } else {
      this.checkText = '';
      this.TheSelectDisplays.controls['searchString'].setValue('');
    }
  }


  dateRangeSelection(event: any) {
    this.timeOutactivity(0, this.isAllDataModified, this.isSaveHealth,"only");
    this.resetBooleans();
    this.errorMsg = '';
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
          this.errorMsg = 'end date must be after startDate';
        } else { search = 2; } // range date selected  
      }

    if (this.errorMsg === '') {
       if (event.target.id === 'selectAllData') {
        this.filterHealth = true;
        this.dateRangeStartHealth = startD;
        this.dateRangeEndHealth = endD;
        this.searchOneDateHealth = search;
      }
      // MUST FIND THE PAGE
      for (var i=0; i<this.HealthAllData.tabDailyReport.length && this.HealthAllData.tabDailyReport[i].date!==this.dateRangeStartHealth; i++){};
      if (i<this.HealthAllData.tabDailyReport.length){
        this.numPage = Math.trunc(i / this.maxItemsPerPage) + 1;
        this.minNum = (this.numPage-1) * this.maxItemsPerPage;
        this.maxNum = this.minNum + this.maxItemsPerPage;
      } 
    }
  }

  clearDates(){
    this.timeOutactivity(0, this.isAllDataModified, this.isSaveHealth,"only");
    this.TheSelectDisplays.controls['startRange'].setValue('');
    this.TheSelectDisplays.controls['endRange'].setValue('');
    this.resetBooleans();
    this.errorMsg = '';
    this.isRangeDateError = false;
    this.filterHealth = false;
    this.searchOneDateHealth = 0;
    this.numPage=1;
    this.minNum=0;
    this.maxNum = this.minNum + this.maxItemsPerPage;
  }

  createDropDownCalFatFn() {
    this.tabFood.splice(0, this.tabFood.length);
    var i = 0;
    var j = 0;

    for (i = 0; i < this.ConfigCaloriesFat.tabCaloriesFat.length; i++) {
      for (j = 0; j < this.ConfigCaloriesFat.tabCaloriesFat[i].Content.length; j++) {
        this.tabFood.push({ name: '', serving: "", unit: "" });
        this.tabFood[this.tabFood.length - 1].name = this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Name.toLowerCase().trim();
        this.tabFood[this.tabFood.length - 1].serving = this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].Serving;
        this.tabFood[this.tabFood.length - 1].unit = this.ConfigCaloriesFat.tabCaloriesFat[i].Content[j].ServingUnit.toLowerCase().trim();
      }
    }
    this.tabFood.sort((a, b) => (a.name < b.name) ? -1 : 1);

  }

  CheckDupeDate(theDate: Date) {
    var i = 0;
    if (this.HealthAllData.tabDailyReport.length > 0) {
      for (i = 0; i < this.HealthAllData.tabDailyReport.length && this.HealthAllData.tabDailyReport[i].date !== theDate; i++) { }
      if (i < this.HealthAllData.tabDailyReport.length) {
        this.errorMsg = 'This date already exists - please modify';
      }
    }
  }

  CreateTabFood(item: any, value: any) {
    var iTab: number = -1;
    this.errorMsg = '';
    var nbDelItem = 0;
    if (item === 'Food') {
      if (this.tabFood.length===0){
        this.createDropDownCalFatFn();
      }
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
      this.styleBoxOptionMeal = getStyleDropDownBox(this.sizeBoxMeal, this.sizeBox.widthOptions - 50, this.offsetLeft - 25, this.posItem, this.sizeBox.scrollY);
    }
  }

  onSelMealFood(event: any) {
    this.timeOutactivity(0, this.isAllDataModified, this.isSaveHealth,"only");
    this.errorMsg = '';
    this.manageIds(event.target.id);
    if (event.currentTarget.id.substring(0, 7) === 'selFood') {
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].name = this.tabInputFood[this.TabOfId[3]].name;
      this.tabInputFood.splice(0, this.tabInputFood.length);
    } else if (event.currentTarget.id.substring(0, 7) === 'selMeal') {
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].name = event.target.textContent.toLowerCase().trim();
      this.tabInputMeal.splice(0, this.tabInputMeal.length);
    }
  }

  onInputDailyAll(event: any) {
    this.theEvent.target.id = event.target.id;
    this.theEvent.target.textContent = event.target.textContent;
    this.theEvent.target.value = event.target.value;
    this.onInputAction = 'onInputDailyAll';
    this.offsetLeft = event.currentTarget.offsetLeft;
    this.offsetWidth = event.currentTarget.offsetWidth;
    this.isSaveHealth=false;
    this.timeOutactivity(0, this.isAllDataModified, this.isSaveHealth,"only");
  }

  onInputDailyAllA(event: any) {
    if (this.tabLock[0].lock !== 2) {
      this.resetBooleans();
      this.isAllDataModified = true;
      this.IsSaveConfirmedAll = false;
      this.errorMsg = '';
      var i = 0;
      const fieldName = event.target.id.substring(0, 7);
      this.manageIds(event.target.id);
      if (fieldName === 'ingrAll') {
        this.isInputFood = true;
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
        this.CreateTabFood('Food', event.target.value);
        if (this.tabInputFood.length === 1 && event.target.value.length > this.strInputFood.length) {
          this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].name = this.tabInputFood[0].name;
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
    this.errorMsg = '';
    var j = -1;
    for (var i = 1; i < idString.length && idString.substring(i, i + 1) !== ':'; i++) {}
    this.myType = idString.substring(0, i).trim();
    this.myAction = idString.substring(i + 1).trim();
  }

  onDropDownAll(event: any) {
    this.timeOutactivity(0, this.isAllDataModified, this.isSaveHealth,"only");
    this.theEvent.target.id = 'selAction-' + this.TabOfId[0] + '-' + this.TabOfId[1] + '-' + this.TabOfId[2];
    this.theEvent.target.textContent = event.target.textContent;
    this.isSaveHealth=false;
    this.onAction(this.theEvent);
  }

  DelAfterConfirm(event: any) {
    this.timeOutactivity(0, this.isAllDataModified, this.isSaveHealth,"only");
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

  onAction(event: any) {
    this.theEvent.target.id = event.target.id;
    this.theEvent.target.textContent = event.target.textContent;
    this.onInputAction = 'onAction';
    this.timeOutactivity(0, this.isAllDataModified, this.isSaveHealth,"only");
  }

  onActionA(event: any) {
    this.resetBooleans();
    if (this.tabLock[0].lock !== 2) {
      this.manageIds(event.target.id);
      this.dialogue[this.prevDialogue] = false;
      if (this.tabLock[0].lock === 0 && event.target.id.substring(0, 10) !== 'openAction') {
        this.isAllDataModified = true;
        this.checkLockLimit.emit({iWait:0,isDataModified:this.isAllDataModified,isSaveFile:this.isSaveHealth, lastInputAt:this.lastInputAt,nbCalls:0});
      }
      else {
        if (event.target.id.substring(0, 10) === 'openAction') {
          this.prevDialogue = 6;
          this.dialogue[this.prevDialogue] = true;
          this.sizeBox.heightOptions = this.sizeBox.heightItem * (this.NewTabAction.length) + 10;
          this.sizeBox.heightContent = this.sizeBox.heightOptions;
          this.styleBox = getStyleDropDownContent(this.sizeBox.heightContent, this.sizeBox.widthContent);
          this.styleBoxOption = getStyleDropDownBox(this.sizeBox.heightOptions, this.sizeBox.widthOptions, 60, 20, this.sizeBox.scrollY);
        } else if (event.target.id.substring(0, 9) === 'selAction') {
          if (event.target.textContent.indexOf('cancel') !== -1) {
          } else {
            this.isAllDataModified = true;
            this.IsSaveConfirmedAll = false;
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
          this.styleBoxOption = getStyleDropDownBox(this.sizeBox.heightOptions, 240, 60, this.posItem, this.sizeBox.scrollY);
        }
      }
    }
  }

  DeleteIngredient(event: any) {
    this.manageIds(event.target.id);
    if (event.target.id.substring(0, 6) === 'DelAll') {
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
    if (event.target.id.substring(0, 6) === 'DelAll') {
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
    } 
  }

  CreateIngredient(event: any) {
    this.manageIds(event.target.id);
    const theIngredient = new ClassDish;
    if (event.target.id.substring(0, 8) === 'AllIngrA') {
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
    if (event.target.id.substring(0, 8) === 'AllMealA') {
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
    }
    if (event.target.id.substring(0, 7) === 'AllDate') {
      const theDate=convertDate(new(Date),"yyyy-mm-dd");
      this.TheSelectDisplays.controls['SelectedDate'].setValue(theDate);
      this.HealthAllData.tabDailyReport[iDate].date=this.TheSelectDisplays.controls['SelectedDate'].value;
      const theMeal = new ClassMeal;
      this.HealthAllData.tabDailyReport[iDate].meal.push(theMeal);
      const theIngredient = new ClassDish;
      this.HealthAllData.tabDailyReport[iDate].meal[0].dish.push(theIngredient);
    } 
  }

  manageIds(theId: string) {
    this.errorMsg = '';
    this.TabOfId.splice(0, this.TabOfId.length);
    const theValue = findIds(theId, "-");
    this.TabOfId = theValue.tabOfId;
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
    this.initTrackRecord.emit();
    this.isAllDataModified = true;
  }

  fillAllData(inRecord: any, outRecord: any) { // TO BE DELETED
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
    this.errorMsg = 'confirm record#' + this.recordToDelete + ' with date=' + theDate + 'to be deleted';
    this.scroller.scrollToAnchor('ListAll');
  }

  ConfirmDelDate() {
    const theDate = this.HealthAllData.tabDailyReport[this.recordToDelete].date;
    this.HealthAllData.tabDailyReport.splice(this.recordToDelete, 1);
    this.errorMsg = 'record#' + this.recordToDelete + ' with date=' + theDate + 'is deleted but file is not saved';
    this.errorFn = 'delDate';
    this.isDeleteConfirmed = false;
    this.isAllDataModified = true;
  }

  cancelDelDate() {
    this.isDeleteConfirmed = false;
  }

  ConfirmSaveA(event: any) {
    this.errorMsg = '';
    this.resetBooleans();
    this.theEvent.target.id = event.target.id;
    this.theEvent.target.value = event.target.value;
    this.theEvent.target.textContent = event.target.textContent;
    this.theEvent.checkLock.iWait=0;
    this.theEvent.checkLock.isDataModified=true;
    this.theEvent.checkLock.isSaveFile=false;
    this.theEvent.checkLock.lastInputAt=this.lastInputAt;
    this.theEvent.fileName=this.SpecificForm.controls['FileName'].value;
    this.onInputAction = "confirmSave";
    this.timeOutactivity(0, true, false,"only");
  }

  SaveHealth(event: any) {
    this.errorMsg = '';
    this.isSaveHealth = true;
    this.IsSaveConfirmedAll = false;
    this.theEvent.target.id = event.target.id;
    this.theEvent.checkLock.iWait=0;
    this.theEvent.checkLock.isDataModified=true;
    this.theEvent.checkLock.isSaveFile=true;
    this.theEvent.checkLock.lastInputAt=this.lastInputAt;
    this.theEvent.fileName = this.SpecificForm.controls['FileName'].value;
    this.theEvent.object = this.SpecificForm.controls['FileName'].value;
    this.theEvent.checkLock.action="saveHealth";
    this.onInputAction = "saveHealth";
    this.timeOutactivity(0, true, true,"saveHealth");
    this.processSaveHealth.emit(this.theEvent);
  }

  saveHealthAfterCheckToLimit(){
    //this.theEvent.checkLock.isSaveFile=false;
    //this.theEvent.checkLock.isDataModified=false;
    //this.processSaveHealth.emit(this.theEvent);
  }

  cancelUpdateAll(event: any) {
    this.onInputAction="cancelUpdateAll";
    this.cancelUpdates.emit(0);
    this.isMustSaveFile = false;
    this.tabInputMeal.splice(0, this.tabInputMeal.length);
    this.tabInputFood.splice(0, this.tabInputFood.length);
    this.IsSaveConfirmedAll = false;
    this.isAllDataModified = false;
    this.errorMsg = '';
    this.errorFn = '';
  }
  
  cancelTheSave(){
    this.IsSaveConfirmedAll = false;
    this.isMustSaveFile = false;
  }

//  checkTimeOut:boolean=true;

  afterCheckFS(){
    console.log('Health component - afterCheckFS - this.onInputAction='+this.onInputAction);
    if (this.returnDataFSHealth.errorCode!==0 && this.returnDataFSHealth.errorCode!==200){
      this.errorMsg = this.returnDataFSHealth.errorMsg;
    } 
    else  if (this.tabLock[0].lock === 1 && this.onInputAction === "onInputDailyAll") {
      this.onInputDailyAllA(this.theEvent);
      this.onInputAction="";
    } else if (this.tabLock[0].lock===1 && this.onInputAction === "onAction") {
      //this.onActionA(this.theEvent);
      this.onInputAction="";
    //} else if (this.onInputAction === "confirmSave"){
    //  this.SpecificForm.controls['FileName'].setValue(this.identification.fitness.files.fileHealth);
    //  this.IsSaveConfirmedAll = true;
    //} else if (this.onInputAction === "saveHealth"){
    //  this.saveHealthAfterCheckToLimit();
    //  this.onInputAction='';
    } else if (this.tabLock[0].action === 'check&update' && this.tabLock[0].status === 0 && this.isMustSaveFile === true) {
      this.ConfirmSaveA(this.theEvent); 
    } else if (this.tabLock[0].lock !== 1 && (this.onInputAction === "saveHealth" || this.onInputAction === "confirmSave")){
      this.errorMsg = "file has been locked by another user; all your updates are lost (" +  this.returnDataFSHealth.errorMsg + ")" + " status=" + this.tabLock[0].status;
      this.isMustSaveFile = false;
      this.isSaveHealth = false;
  //    this.checkTimeOut = false;
    } else if (this.tabLock[0].lock === 2) {
          this.isAllDataModified = false; // is envionment reinitialised
          this.isSaveHealth = false;
    } else {
      console.log('File is locked by this user; no specific action needed; user can update the data');
    }
  }

  firstLoop:boolean=true;
  ngOnChanges(changes: SimpleChanges) {
    console.log('Health component - ngOnChanges - this.onInputAction='+this.onInputAction);
    var callAfterCheck=0;
    if (this.firstLoop===true){
      this.firstLoop=false;
      for (const propName in changes) {
        const j = changes[propName];
        if (propName==='ConfigCaloriesFat') {
          this.createDropDownCalFatFn();
        }
      }
    }
    else {
      for (const propName in changes) {
        const j = changes[propName];
        if (propName === 'resultCheckLimitHealth' && changes[propName].firstChange === false) {
          if (callAfterCheck===0){
            callAfterCheck++
            this.afterCheckFS();
          }
        } else if (propName === 'actionHealth' && changes[propName].firstChange === false) {
          console.log("**** health component - ngOnChange - propName === 'actionHealth");
          if (this.onInputAction === "onInputDailyAll") {
            this.onInputDailyAllA(this.theEvent);
          } else if (this.onInputAction === "onAction") {
//            this.onActionA(this.theEvent);
          } else if (this.onInputAction === "confirmSave"){
            this.SpecificForm.controls['FileName'].setValue(this.identification.fitness.files.fileHealth);
            this.IsSaveConfirmedAll = true;
          } else if (this.onInputAction === "saveHealth"){
              console.log("**** health component - ngOnChange - this.onInputAction === saveHealth");
          } else if (this.onInputAction==="cancelUpdateAll"){
            if (this.filterHealth = true && (this.  TheSelectDisplays.controls['startRange'].value !== '' || this.TheSelectDisplays.controls['endRange'].value !== '')) {
              this.theEvent.target.id === 'selectAllData';
              this.dateRangeSelection(this.theEvent);
            } else {
              this.maxNum = this.maxItemsPerPage;
              this.minNum = 0;
              this.numPage = 1;
            }
          } else if (this.onInputAction==="userTimeOut"){ // the corresponding feature has been removed
              this.errorMsg='Application has been reinitialised';
              this.isUserTimeOut=false;
          }
          this.onInputAction="";
        } else if (propName==='returnDataFSHealth' && changes[propName].firstChange === false) {
          if (callAfterCheck===0){
            callAfterCheck++  
            this.afterCheckFS();
          }
        } else if (propName === 'calculateHeight') {
            console.log("**** health component - ngOnChange - propName === 'calculateHeight");
            this.calculateHeight();
        }  else if (propName === 'ConfigCaloriesFat') {
            this.createDropDownCalFatFn();
        } else if (propName === 'callSaveFunction') {
            this.isMustSaveFile = false;
            this.isSaveHealth = false;
            this.IsSaveConfirmedAll = false;
            this.theEvent.checkLock.isDataModified = false;
            this.theEvent.checkLock.isSaveFile = false;
            this.theEvent.checkLock.iCheck = true;
            this.resetBooleans();

            if (this.statusSaveFn.status===200 || this.statusSaveFn.status===0){
              this.errorMsg='File has been successfully saved';
              this.isAllDataModified = false;
            } else {
              this.errorMsg=this.statusSaveFn.err;
            }
        } 
      }  
    }
  }


}

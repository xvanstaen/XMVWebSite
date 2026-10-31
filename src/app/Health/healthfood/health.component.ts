import {
  Component, Input, Output, HostListener, 
  signal, input, effect,  EventEmitter, 
   Inject, LOCALE_ID
} from '@angular/core';

import { MatIconModule} from '@angular/material/icon';
import { CommonModule,  ViewportScroller } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup, FormControl, Validators} from '@angular/forms';

import { MainManageFileComponent } from '../../fileAccessMgt/file-access.component';

import { configServer, LoginIdentif, msgConsole, classtheEvent } from '../../JsonServerClass';
import { classPosDiv, getPosDiv } from '../../getPosDiv';

import { getStyleDropDownContent, getStyleDropDownBox, classDropDown } from '../../DropDownStyle'

import {  mainClassCaloriesFat } from '../ClassHealthCalories'
import {  DailyReport, mainDailyReport, ClassMeal, ClassDish } from '../ClassHealthCalories'

import {  classConfTableAll } from '../classConfHTMLTableAll';

import {  classAccessFile , classHeaderReturnDataFS , classRetrieveFile} from '../../classFileSystem';

import { convertDate, strDateTime,  findIds } from '../../MyStdFunctions';
import {  classPosSizeClock} from '../../clockFunctions'

@Component({
  selector: 'app-health',
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.css'],
  standalone:true,
  imports:[CommonModule, FormsModule, ReactiveFormsModule, MatIconModule,  MainManageFileComponent ], //RunningClockComponent

})
export class HealthComponent  {

  @Output() initTrackRecord = new EventEmitter<any>();
  //@Output() retrieveRecord = new EventEmitter<any>();

  @Output() checkLockLimit = new EventEmitter<any>();
  @Output() cancelUpdates = new EventEmitter<any>();
  @Output() processSaveHealth = new EventEmitter<any>();
  @Output() calculateCalFat= new EventEmitter<any>();
  //@Output() unlockFile = new EventEmitter<any>();

  @Input() configServer = new configServer;
  @Input() identification = new LoginIdentif;
  @Input() tabLock: Array<classAccessFile> = []; //0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked;

  @Input() ConfigCaloriesFat = new mainClassCaloriesFat;
  @Input() HealthAllData = new mainDailyReport;
  @Input() confTableAll = new classConfTableAll;
  @Input() tabNewRecordAll: Array<any> = [
    {
      ngStyle:0,
      even:0,
      change:false,
      nb: 0,
      meal: [{
        nb: 0,
        food: [{ nb: 0}]
      }]
    }
  ];

  @Input() returnDataFSHealth = new classHeaderReturnDataFS;
  @Input() statusSaveFn:any;

  isHovered: boolean = false;
  dynamicHoverColor = signal<string>('red');
  dynamicHoverBackgColor = signal<string>('green');
  healthTableW:number=0;

  signalUpdateHealth=signal<boolean>(false);

  signalActionHealth=input.required<number>();
  //@Input() actionHealth:number = -1;
  previousSignalActionHealth:number=-1;
  //resultCheckLimitHealth=input.required<number>();
  @Input() resultCheckLimitHealth:number = -1;
  //healthFileRetrieved=input.required<number>();
  previousresultCheckLimitHealth:number=-1;

  iWaitToRetrieve:Array<classRetrieveFile>=[];

  openFileAccess=signal<boolean>(false);
  isUserTimeOut=signal<boolean>(false);
  signalTime=signal<number>(0); // to get count down of the timeout

  triggerCheckToLimit=signal<number>(-1);
  triggerFileSystem=signal<number>(-1);
  triggerReadFile=signal<number>(-1);
  triggerSaveFile=signal<number>(-1); // required by OpenAccessFile thought not needed by Health component
  

  secondaryLevelFn:boolean=true;
  lockValueBeforeCheck:number=0;

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

  // to display content of table
  tabHeader:Array<any>=[];
  divClassHeader:Array<any>=[];
  tabContent:Array<any>=[];
  tabDivContent:Array<any>=[];
  tabDivEmptyContent:Array<any>=[];
  tabSubTotal:Array<any>=[];
  tabTotal:Array<any>=[];
  
  /*
  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    //this.selectedPosition = { x: event.pageX, y: event.pageY };
    //this.getPosDivAfterTitle();
    this.posDivAfterTitle = getPosDiv("posAfterTitle");
    this.eventClientY = event.clientY;
  }
  */

  constructor(
    private scroller: ViewportScroller,
    @Inject(LOCALE_ID) private locale: string,
    ) {effect (() => {
          //if (this.tabLock[0].lock===1 && this.onInputAction!==""){
          //    this.errorMsg="";
          //}

          if (this.previousresultCheckLimitHealth!==this.resultCheckLimitHealth){
            this.previousresultCheckLimitHealth=this.resultCheckLimitHealth;
            this.afterCheckFS(this.resultCheckLimitHealth);
          }
              
          if (this.previousSignalActionHealth!==this.signalActionHealth()){
            this.previousSignalActionHealth=this.signalActionHealth();
            this.processSignalFunctions();  
          }
           
      }) }

  actionMouseUp(event:any){
    this.posDivAfterTitle = getPosDiv("posAfterTitle");
    this.eventClientY = event.clientY;
  }

  findPosItem(sizeBox: any) {
    this.foodPos = Math.trunc(Number(this.eventClientY) - Number(this.posDivAfterTitle.ClientRect.Top) - this.confTableAll.title.height) ;
    this.posItem =  this.foodPos - Number(sizeBox) / 2 + 10;
  }

  @HostListener('window:resize', []) /* '$event' */
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
    console.log("Health -- server google = " + this.configServer.googleServer);
    this.createDropDownCalFatFn();
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
    const A = { name: 'calCalFat' };
    this.TabAction.push(A);
    const E = { name: 'detailNutFacts' };
    this.TabAction.push(E);
    const B = { name: 'insert before' };
    this.TabAction.push(B);
    const C = { name: 'insert after' };
    this.TabAction.push(C);
    const D = { name: 'delete' };
    this.TabAction.push(D);
    const tabItems = ['date', 'meal', 'food'];

    this.NewTabAction[0].type = '';
    this.NewTabAction[0].name = 'cancel';
    const E1 = { type: '', name: 'calCalFat' };
    this.NewTabAction.push(E1);
    const E2 = { type: '', name: 'detailNutFacts' };
    this.NewTabAction.push(E2);
    var k = 2;
    for (i = 0; i < tabItems.length; i++) {
      for (var j = 0; j < 3; j++) {
        k++;
        const E = { type: 'a', name: 'A' };
        this.NewTabAction.push(E);
        this.NewTabAction[k].type = tabItems[i];
        this.NewTabAction[k].name = this.TabAction[j + 3].name;
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

    //this.configServer.timeoutFileSystem.userTimeOut.mn=2;
    console.log('ngInit() calls this.timeToGo() => userActivity=' + this.userActivity.substring(0,14));
    //this.userActivity = defineMyDate();
    this.lastInputAt = strDateTime();
    this.refDate=new Date();
  

    this.dynamicHoverColor.set(this.confTableAll.rowHover.color);
    this.dynamicHoverBackgColor.set(this.confTableAll.rowHover.background);
    this.healthTableW=this.confTableAll.width - 20;
  }

  firstLoopInit:boolean=true;
  
  timeOutactivity(iWait: number, isDataModified: boolean, isSaveFile: boolean,theAction:string){
    console.log('Health component - timeOutactivity');
    this.firstLoopInit=false;
    window.cancelAnimationFrame(this.idAnimation);
    this.callTimeToGo();
    if (this.identification.triggerFileSystem.toUpperCase()!=="YES"){
      this.isUserTimeOut.set(false);
      return;
    }
    this.refDate=new Date();
    this.lastInputAt = strDateTime();
    if (theAction==="only" ){
      this.theEvent.checkLock.action='checkTO';
      this.theEvent.checkLock.iWait=iWait;
      this.theEvent.checkLock.isDataModified=isDataModified;
      this.theEvent.checkLock.isSaveFile=isSaveFile;
      this.theEvent.checkLock.iCheck=true;
      this.theEvent.checkLock.lastInputAt=this.lastInputAt;
      this.theEvent.checkLock.nbCalls++;
      this.triggerCheckToLimit.update(CheckLimit => CheckLimit + 1);
      this.lockValueBeforeCheck=this.tabLock[0].lock;
      this.openFileAccess.set(true);
      //this.checkLockLimit.emit({iWait:iWait,isDataModified:isDataModified,isSaveFile:isSaveFile, lastInputAt:this.lastInputAt, iCheck:true,nbCalls:0,action:theAction});
    }
  }

  refDate=new Date();
  displaySec:number=0;
  displayMin:number=0;
  displayHour:number=0;
  idAnimation:any;
  callTimeToGo(){
    if (this.isUserTimeOut()){
        this.isUserTimeOut.set(false);
    }
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

    if (this.tabLock[0].lock===3){
      this.tabLock[0].action="unlock";
      this.tabLock[0].updatedAt=this.lastInputAt;
    }

      if (timeSpent > Number(timeOutSec) ) {
        this.isUserTimeOut.set(true);
        this.tabLock[0].action="unlock";
        this.tabLock[0].updatedAt=this.lastInputAt;
        //if (this.firstLoopInit===true){    
          //this.unlockFile.emit(0);
          this.theEvent.checkLock.action='unlock';
          this.theEvent.checkLock.iWait=0;
          this.theEvent.checkLock.isDataModified=false;
          this.theEvent.checkLock.isSaveFile=false;
          this.theEvent.checkLock.iCheck=true;
          this.theEvent.checkLock.lastInputAt=this.lastInputAt;
          this.theEvent.checkLock.nbCalls++;
          this.triggerCheckToLimit.update(CheckLimit => CheckLimit + 1);
          this.lockValueBeforeCheck=this.tabLock[0].lock;
          this.openFileAccess.set(true);
        //}
        return;
    }

    if (timeLeft <= 0 && this.isAllDataModified===true){
        this.errorMsg = "your modifications are going to be lost if you don't save them";
    } 
    this.displayHour = Math.floor(timeLeft / 3600);
    const minSec = timeLeft % 3600 ;
    this.displayMin = Math.floor(minSec / 60);
    this.displaySec = minSec % 60 ;
    this.signalTime.update(time => time + 1);
    this.idAnimation=window.requestAnimationFrame(() => this.timeToGo(refDateSec,timeOutSec));
  }
 
  resultAccessFile(event:any){
    this.openFileAccess.set(false);
    this.returnDataFSHealth=event;
    console.log('Health component - resultAccessFile');
    if (this.lockValueBeforeCheck!==this.tabLock[0].lock || this.onInputAction!==''){

      if (this.tabLock[0].lock===1 && this.lockValueBeforeCheck!==this.tabLock[0].lock){
        this.errorMsg = "You can now update the file";

      } else if (this.tabLock[0].action==="unlock"){
        this.errorMsg = "File has been unlocked. Relaunch the application";
        this.isUserTimeOut.set(false);
      } else if (this.tabLock[0].lock!==1){
        this.errorMsg = "File is locked by another user";
        this.isUserTimeOut.set(false);
      }
      this.lastInputAt = strDateTime();
      this.refDate=new Date();
      this.callTimeToGo();
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
    this.errorFn="";
    this.errorMsg="";
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
      if (!this.isUserTimeOut()){
        this.tabNewRecordAll.splice(0, this.tabNewRecordAll.length);
        this.initTrackRecord.emit();
      }
      this.isMustSaveFile = false;
      //this.isSaveHealth = false;
      this.isForceReset = false;
    }
  }

  calFatCalculation(i:number){
    this.calculateCalFat.emit(i)
  }

  tabNutritionFacts=["calories","proteins", "carbs","sugar", "natural sugar","added sugar", "sat.fat", "total fat"];
  detailNutFacts(j:number){
    var k=this.TabOfId[2];
    for (var i=0; i<this.tabNutritionFacts.length; i++){
      this.TabOfId[2]=k+i;
      this.theEvent.target.id = 'AllIngrA-' + this.TabOfId[0] + '-' + this.TabOfId[1] + '-' + this.TabOfId[2];
      this.CreateIngredient(this.theEvent);
      this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]+1].name=this.tabNutritionFacts[i];
    }
  }

  checkText: string = '';
  SearchText(event: any) {
    this.errorMsg="";
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
    this.openFileAccess.set(false);
    this.errorMsg="";
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
    this.openFileAccess.set(false);
    var found=true;
    if (this.tabLock[0].lock !== 2) {
      this.resetBooleans();
      this.isAllDataModified = true;
      this.IsSaveConfirmedAll = false;
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
      } else if (fieldName === 'caloAll') {
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.Calories = event.target.value;
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
      } else if (fieldName === 'protAll') {
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.Protein = event.target.value;
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
      } else if (fieldName === 'cholAll') {
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.Cholesterol = event.target.value;
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
      } else if (fieldName === 'sugaAll') {
        const addedPercent=this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.addedSugar / this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.Sugar;
        const naturalPercent=this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.naturalSugar / this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.Sugar;
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.Sugar = event.target.value;
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.addedSugar = event.target.value * addedPercent;
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.naturalSugar = event.target.value * naturalPercent;
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.Sugar = Number(event.target.value)
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
      } else if (fieldName === 'addSAll') {
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.addedSugar = Number(event.target.value);
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.Sugar=Number(this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.naturalSugar) + Number(event.target.value);
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
      } else if (fieldName === 'natSAll') {
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.naturalSugar = Number(event.target.value);
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.Sugar=Number(this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.addedSugar) + Number(event.target.value);
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
      } else if (fieldName === 'carbAll') {
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.Carbs = event.target.value;
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
      } else if (fieldName === 'satuAll') {
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.Fat.Saturated = event.target.value;
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
      } else if (fieldName === 'tFatAll') {
        this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.Fat.Total = event.target.value;
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
      } else if (fieldName === 'lockAll') {
        if (event.target.value.toUpperCase().trim()==="N" || event.target.value.toUpperCase().trim()==="Y" || event.target.value.toUpperCase().trim()===""){
          this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.lockData = event.target.value.toUpperCase().trim();
        } else {
          this.errorMsg=" Value " + event.target.value + " is incorrect. Enter 'N' or 'Y' only";
          // 1. Update your TypeScript model data
          this.HealthAllData.tabDailyReport[this.TabOfId[0]].meal[this.TabOfId[1]].dish[this.TabOfId[2]].calFat.lockData = "N";

          // 2. Generate the exact same ID your HTML template uses
          const targetId = `lockAll-${this.TabOfId[0]}-${this.TabOfId[1]}-${this.TabOfId[2]}`;

          // 3. Directly target the native HTML input element and force the value
          const nativeInput = document.getElementById(targetId) as HTMLInputElement;
          if (nativeInput) {
            nativeInput.value = "N";
          }

        }
        this.tabNewRecordAll[this.TabOfId[0]].meal[this.TabOfId[1]].food[this.TabOfId[2]].nb = 1;
      } else { found=false; this.signalUpdateHealth.set(false);}
      if (found===true){
        this.signalUpdateHealth.set(true);
        this.tabNewRecordAll[this.TabOfId[0]].change=true;
        this.tabNewRecordAll[this.TabOfId[0]].ngStyle=2;
      }
    }
  }

  findAction(idString: string) {
    this.openFileAccess.set(false);
    this.errorMsg = '';
    var j = -1;
    for (var i = 1; i < idString.length && idString.substring(i, i + 1) !== ':'; i++) {}
    this.myType = idString.substring(0, i).trim();
    this.myAction = idString.substring(i + 1).trim();
  }

  onDropDownAll(event: any) {
    this.openFileAccess.set(false);
    // this.timeOutactivity(0, this.isAllDataModified, this.isSaveHealth,"only");
    this.theEvent.target.id = 'selAction-' + this.TabOfId[0] + '-' + this.TabOfId[1] + '-' + this.TabOfId[2];
    this.theEvent.target.textContent = event.target.textContent;
    this.isSaveHealth=false;
    this.onAction(this.theEvent);
  }

/** Builds ids like 'AllMealA-2-1' from a prefix and the first `depth` indices of TabOfId */
private idFor(prefix: string, depth: number): string {
  return [prefix, ...this.TabOfId.slice(0, depth)].join('-');
}

/** Flags a day as changed (once) and refreshes row styling */
private markChangedOnce(d: number) {
  if (this.tabNewRecordAll[d].change === false) {
    this.markChanged(d);          // helper from the earlier refactor
    this.reInitBackground();
  }
}

DelAfterConfirm(event: any) {
  this.openFileAccess.set(false);
  this.timeOutactivity(0, this.isAllDataModified, this.isSaveHealth, 'only');
  this.resetBooleans();
  this.isDeleteItem = false;

  if (!event.currentTarget.id.startsWith('YesDelConfirm')) return;

  const target = this.theEvent.target;
  if (target.id.startsWith('DelAllDate')) {
    target.id = this.idFor('DelAllDate', 1);
    this.DeleteDay(this.theEvent);
  } else if (target.id.startsWith('DelAllMeal')) {
    target.id = this.idFor('DelAllMeal', 2);
    this.DeleteMeal(this.theEvent);
  } else if (target.id.startsWith('DelAll-')) {
    target.id = this.idFor('DelAll', 3);
    this.DeleteIngredient(this.theEvent);
  }
}

onAction(event: any) {
  this.openFileAccess.set(false);
  this.errorMsg = '';
  this.theEvent.target.id = event.target.id;
  this.theEvent.target.textContent = event.target.textContent;
  this.onInputAction = 'onAction';
  this.timeOutactivity(0, this.isAllDataModified, this.isSaveHealth, 'only');
}

onActionA(event: any) {
  this.resetBooleans();
  const lock = this.tabLock[0].lock;
  if (lock === 2) return;

  const id: string = event.target.id;
  const text: string = event.target.textContent;
  const isOpen = id.startsWith('openAction');

  this.manageIds(id);
  this.dialogue[this.prevDialogue] = false;

  if (lock === 0 && !isOpen) {
    this.isAllDataModified = true;
    this.checkLockLimit.emit({
      iWait: 0,
      isDataModified: this.isAllDataModified,
      isSaveFile: this.isSaveHealth,
      lastInputAt: this.lastInputAt,
      nbCalls: 0,
    });
    return;
  }

  const sb = this.sizeBox;

  if (isOpen) {
    this.prevDialogue = 6;
    this.dialogue[6] = true;
    sb.heightOptions = Math.min(sb.heightItem * this.NewTabAction.length + 10, 250);
    sb.heightContent = sb.heightOptions;
    this.styleBox = getStyleDropDownContent(sb.heightContent, sb.widthContent);
    this.styleBoxOption = getStyleDropDownBox(sb.heightOptions, sb.widthOptions, 60, 0, 'scroll');
  } else if (id.startsWith('selAction')) {
    if (!text.includes('cancel')) {
      this.isAllDataModified = true;
      this.IsSaveConfirmedAll = false;
      this.findAction(text);
      this.runSelectedAction(this.myType.trim(), this.myAction);
    }
  } else if (id.startsWith('ActionDate')) {
    // see note 1: these ids don't match what CreateDay/DeleteDay look for
    const prefixes: Record<string, string> = {
      'insert after': 'DateA',
      'insert before': 'DateB',
      'delete': 'DelDate',
    };
    const prefix = prefixes[text];
    if (prefix) {
      this.theEvent.target.id = this.idFor(prefix, 1);
      if (text === 'delete') this.DeleteDay(this.theEvent);
      else this.CreateDay(this.theEvent);
    }
  }

  if (this.prevDialogue < 6) {
    sb.heightOptions = sb.heightItem * (this.TabAction.length + 1);
    sb.heightContent = sb.heightOptions;
    this.styleBox = getStyleDropDownContent(sb.heightContent, sb.widthContent);
    this.styleBoxOption = getStyleDropDownBox(sb.heightOptions, sb.widthOptions, 30, 0, sb.scrollY);
  } else if (this.isDeleteItem === true) {
    sb.heightOptions = 90;
    sb.heightContent = 90;
    this.styleBox = getStyleDropDownContent(90, 240);
    this.styleBoxOption = getStyleDropDownBox(90, 240, 60, this.posItem, sb.scrollY);
  }
}

/** Handles the date / meal / food levels with one code path, plus the two calc actions */
private runSelectedAction(type: string, action: string) {
  const [d, m, i] = this.TabOfId;
  const days = this.HealthAllData.tabDailyReport;

  const levels = {
    date: {
      depth: 1, add: 'AllDate', del: 'DelAllDate', pos: this.posDelDate,
      create: (e: any) => this.CreateDay(e),
      msg: () => ' date=' + days[d].date,
    },
    meal: {
      depth: 2, add: 'AllMeal', del: 'DelAllMeal', pos: this.posDelMeal,
      create: (e: any) => this.CreateMeal(e),
      msg: () => ' meal=' + days[d].meal[m].name,
    },
    food: {
      depth: 3, add: 'AllIngr', del: 'DelAll', pos: this.posDelIngr,
      create: (e: any) => this.CreateIngredient(e),
      msg: () => ` ingredient ${days[d].meal[m].dish[i].name} of meal ${days[d].meal[m].name}`,
    },
  };
  const level = (levels as Record<string, typeof levels.date | undefined>)[type];

  if (level) {
    if (action === 'insert after' || action === 'insert before') {
      const side = action === 'insert after' ? 'A' : 'B';
      this.theEvent.target.id = this.idFor(level.add + side, level.depth);
      level.create(this.theEvent);
    } else if (action === 'delete') {
      this.theEvent.target.id = this.idFor(level.del, level.depth);
      this.delMsg = level.msg();
      this.posDelConfirm = level.pos;
      this.isDeleteItem = true;
    }
  } else if (type === 'calCalFat') {
    this.calFatCalculation(d);
  } else if (type === 'detailNutFacts') {
    this.detailNutFacts(d);
  }
}

DeleteIngredient(event: any) {
  const id: string = event.target.id;
  this.manageIds(id);
  if (!id.startsWith('DelAll')) return;

  const [d, m, i] = this.TabOfId;     // captured: CreateIngredient re-runs manageIds
  const meal = this.HealthAllData.tabDailyReport[d].meal[m];

  meal.dish.splice(i, 1);
  this.tabNewRecordAll[d].meal[m].food.splice(i, 1);

  if (meal.dish.length === 0) {
    this.theEvent.target.id = this.idFor('AllIngrA', 3);
    this.CreateIngredient(this.theEvent);
  }
  this.markChangedOnce(d);
}

DeleteMeal(event: any) {
  const id: string = event.target.id;
  this.manageIds(id);
  if (!id.startsWith('DelAll')) return;

  const [d, m] = this.TabOfId;
  const day = this.HealthAllData.tabDailyReport[d];

  day.meal.splice(m, 1);
  this.tabNewRecordAll[d].meal.splice(m, 1);
  this.markChangedOnce(d);

  if (day.meal.length === 0) {
    this.theEvent.target.id = this.idFor('AllMealA', 2);
    this.CreateMeal(this.theEvent);
  }
}

DeleteDay(event: any) {
  const id: string = event.target.id;
  this.manageIds(id);
  if (!id.startsWith('DelAllDate')) return;

  const [d] = this.TabOfId;
  this.HealthAllData.tabDailyReport.splice(d, 1);
  this.tabNewRecordAll.splice(d, 1);
  this.reInitBackground();
}

  /** 'A' suffix → insert after current item (+1), 'B' suffix → insert before (0), otherwise null */
  private insertOffset(id: string, prefix: string): 0 | 1 | null {
    if (id.startsWith(prefix + 'A')) return 1;
    if (id.startsWith(prefix + 'B')) return 0;
    return null;
  }

  private markChanged(dayIndex: number) {
    const rec = this.tabNewRecordAll[dayIndex];
    rec.change = true;
    rec.ngStyle = 2;
  }

  CreateIngredient(event: any) {
    const id: string = event.target.id;
    this.manageIds(id);
    const [d, m, i] = this.TabOfId;

    const offset = this.insertOffset(id, 'AllIngr');
    if (offset !== null) {
      this.HealthAllData.tabDailyReport[d].meal[m].dish.splice(i + offset, 0, new ClassDish());
      this.tabNewRecordAll[d].meal[m].food.splice(i + offset, 0, { nb: 1 });
    }

    this.markChanged(d);
    this.reInitBackground();
  }

  CreateMeal(event: any) {
    const id: string = event.target.id;
    this.manageIds(id);
    const [d, m] = this.TabOfId;

    const offset = this.insertOffset(id, 'AllMeal');
    if (offset === null) return;

    const idx = m + offset;
    const meal = new ClassMeal();
    meal.dish.push(new ClassDish());
    this.HealthAllData.tabDailyReport[d].meal.splice(idx, 0, meal);
    this.tabNewRecordAll[d].meal.splice(idx, 0, { nb: 1, food: [{ nb: 1 }] });

    this.markChanged(d);
    this.reInitBackground();
  }

  CreateDay(event: any) {
    const id: string = event.target.id;
    this.manageIds(id);
    const offset = this.insertOffset(id, 'AllDate');

    if (offset !== null) {
      const idx = this.TabOfId[0] + offset;

      const daily = new DailyReport();
      this.HealthAllData.tabDailyReport.splice(idx, 0, daily);
      this.tabNewRecordAll.splice(idx, 0, {
        ngStyle: 0,
        even: 0,
        change: true,
        nb: 1,
        meal: [{ nb: 1, food: [{ nb: 1 }] }],
      });

      const today = convertDate(new Date(), 'yyyy-mm-dd');
      const dateCtrl = this.TheSelectDisplays.controls['SelectedDate'];
      dateCtrl.setValue(today);
      daily.date = dateCtrl.value;

      const meal = new ClassMeal();
      meal.dish.push(new ClassDish());
      daily.meal.push(meal);
    }

    this.reInitBackground();
  }

reInitBackground() {
  this.tabNewRecordAll.forEach((rec, i) => {
    const parity = i % 2;           // 0 = even row, 1 = odd row
    rec.even = parity;
    rec.ngStyle = rec.change ? 2 : parity;
  });
}

manageIds(theId: string) {
  this.errorMsg = '';
  this.TabOfId = findIds(theId, '-').tabOfId;
}

cleanFile() {
  const dateCtrl = this.TheSelectDisplays.controls['SelectedDate'];

  // 1. Drop days that have no meals (checked before meals are cleaned, as in the original)
  this.HealthAllData.tabDailyReport = this.HealthAllData.tabDailyReport
    .filter(day => day.meal.length > 0);

  for (const day of this.HealthAllData.tabDailyReport) {
    // 2. Trim timestamps down to yyyy-mm-dd
    const dateStr = day.date.toString();
    if (dateStr.length > 10) {
      dateCtrl.setValue(dateStr.substring(0, 10));
      day.date = dateCtrl.value;
    }

    // 3. Drop meals with no name and no dishes
    day.meal = day.meal.filter(meal => meal.dish.length > 0 || meal.name !== '');

    // 4. Drop empty dishes (no name and zero quantity)
    for (const meal of day.meal) {
      meal.dish = meal.dish.filter(d => !(d.name === '' && d.quantity === 0));
    }
  }

  this.tabNewRecordAll.length = 0;
  this.initTrackRecord.emit();
  this.isAllDataModified = true;
}

fillAllData(inRecord: any, outRecord: any) { // TO BE DELETED
  outRecord.date = inRecord.date;
  outRecord.burntCalories = inRecord.burntCalories;
  outRecord.total = inRecord.total;

  for (const inMeal of inRecord.meal) {
    const meal = new ClassMeal();
    meal.name = inMeal.name;
    meal.total = inMeal.total;
    meal.dish.push(...inMeal.dish);
    outRecord.meal.push(meal);
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
  const idx = this.recordToDelete;
  const { date } = this.HealthAllData.tabDailyReport[idx];

  this.HealthAllData.tabDailyReport.splice(idx, 1);
  this.tabNewRecordAll.splice(idx, 1);
  this.reInitBackground();

  this.errorMsg = `record#${idx} with date=${date} is deleted but file is not saved`;
  this.errorFn = 'delDate';
  this.isDeleteConfirmed = false;
  this.isAllDataModified = true;
}

cancelDelDate() {
  this.isDeleteConfirmed = false;
}

/** Shared setup for the lock check that precedes a save */
private prepareCheckLock(event: any, isSaveFile: boolean) {
  const ev = this.theEvent;
  ev.target.id = event.target.id;
  ev.fileName = this.SpecificForm.controls['FileName'].value;
  ev.checkLock.iWait = 0;
  ev.checkLock.isDataModified = true;
  ev.checkLock.isSaveFile = isSaveFile;
  ev.checkLock.lastInputAt = this.lastInputAt;
}

ConfirmSaveA(event: any) {
  this.openFileAccess.set(false);
  this.errorMsg = '';
  this.errorFn = '';
  this.resetBooleans();

  this.prepareCheckLock(event, false);
  this.theEvent.target.value = event.target.value;
  this.theEvent.target.textContent = event.target.textContent;

  this.onInputAction = 'confirmSave';
  this.timeOutactivity(0, true, false, 'only');
}

SaveHealth(event: any) {
  this.errorMsg = '';
  this.errorFn = '';
  this.isSaveHealth = true;
  this.IsSaveConfirmedAll = false;

  this.prepareCheckLock(event, true);
  this.theEvent.object = this.theEvent.fileName;
  this.theEvent.checkLock.action = 'saveHealth';

  this.onInputAction = 'saveHealth';
  this.timeOutactivity(0, true, true, 'saveHealth');
  this.processSaveHealth.emit(this.theEvent);
}

cancelUpdateAll() {
  this.onInputAction = 'cancelUpdateAll';
  this.cancelUpdates.emit(0);
  this.isMustSaveFile = false;
  this.tabInputMeal.length = 0;
  this.tabInputFood.length = 0;
  this.IsSaveConfirmedAll = false;
  this.isAllDataModified = false;
  this.errorMsg = '';
  this.errorFn = '';
}

processSignalFunctions() {
  switch (this.onInputAction) {
    case 'saveHealth': {
      this.isMustSaveFile = false;
      this.isSaveHealth = false;
      this.IsSaveConfirmedAll = false;
      this.theEvent.checkLock.isDataModified = false;
      this.theEvent.checkLock.isSaveFile = false;
      this.theEvent.checkLock.iCheck = true;
      this.resetBooleans();

      const { status, err } = this.statusSaveFn;
      if (status === 200 || status === 0) {
        this.errorMsg = 'File has been successfully saved';
        this.isAllDataModified = false;
      } else {
        this.errorMsg = err;
      }
      break;
    }
    case 'cancelUpdateAll': {
      const { startRange, endRange } = this.TheSelectDisplays.controls;
      const hasRange = startRange.value !== '' || endRange.value !== '';

      this.filterHealth = hasRange; // see note 1
      if (hasRange) {
        // this.theEvent.target.id = 'selectAllData';  // see note 2
        this.dateRangeSelection(this.theEvent);
      } else {
        this.maxNum = this.maxItemsPerPage;
        this.minNum = 0;
        this.numPage = 1;
      }
      break;
    }
  }
  this.onInputAction = '';
}

cancelTheSave() {
  this.IsSaveConfirmedAll = false;
  this.isMustSaveFile = false;
}

afterCheckFS(data: any) {
  this.openFileAccess.set(false);
  const lock = this.tabLock[0];

  if (this.firstLoopInit === true && lock.lock === 1) {
    this.firstLoopInit = false;
    this.lastInputAt = strDateTime();
    this.refDate = new Date();
    this.callTimeToGo();
  }

  this.errorFn = '';
  if (this.identification.triggerFileSystem.toUpperCase() !== 'YES') {
    lock.lock = 1;
  }
  if (this.resultCheckLimitHealth === -1) return;

  const { errorCode, errorMsg } = this.returnDataFSHealth;
  const action = this.onInputAction;
  const isSaving = action === 'saveHealth' || action === 'confirmSave';

  if (errorCode !== 0 && errorCode !== 200) {
    this.errorMsg = errorMsg;
  } else if (lock.lock === 1 && action === 'onInputDailyAll') {
    this.onInputDailyAllA(this.theEvent);
    this.onInputAction = '';
  } else if (lock.lock === 1 && action === 'onAction') {
    this.onInputAction = '';
  } else if (lock.action === 'check&update' && lock.status === 0 && this.isMustSaveFile === true) {
    this.ConfirmSaveA(this.theEvent);
  } else if (lock.lock !== 1 && isSaving) {
    this.errorMsg = `file has been locked by another user; all your updates are lost (${errorMsg}) status=${lock.status}`;
    this.isMustSaveFile = false;
    this.isSaveHealth = false;
  } else if (lock.lock === 2) {
    this.isAllDataModified = false; // environment is reinitialised
    this.isSaveHealth = false;
  }
  // otherwise: locked by this user, nothing to do
}

}

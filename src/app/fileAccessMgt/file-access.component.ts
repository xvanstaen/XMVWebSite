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

import { BucketList, Bucket_List_Info } from '../JsonServerClass';

// configServer is needed to use ManageGoogleService
// it is stored in MongoDB and accessed via ManageMongoDBService

import { msginLogConsole } from '../consoleLog'
import { configServer, LoginIdentif, msgConsole, classCredentials, classtheEvent } from '../JsonServerClass';
import { classPosDiv, getPosDiv } from '../getPosDiv';

import { getStyleDropDownContent, getStyleDropDownBox, classDropDown } from '../DropDownStyle'

import { ClassSubConv, ClassConv, mainClassConv, mainConvItem, ClassUnit, ConvItem } from '../ClassConverter'

import { ClassCaloriesFat, mainClassCaloriesFat } from '../Health/ClassHealthCalories'
import { ClassItem, DailyReport, mainDailyReport, ClassMeal, ClassDish } from '../Health/ClassHealthCalories'

import { classConfHTMLFitHealth, classConfTableAll } from '../Health/classConfHTMLTableAll';

import { CalcFatCalories } from '../Health/CalcFatCalories';
import { classConfigChart, classchartHealth } from '../Health/classConfigChart';
import { classAxis, classLegendChart, classPluginTitle, classTabFormChart, classFileParamChart } from '../Health/classChart';
import { classFileSystem, classAccessFile, classReturnDataFS, classHeaderReturnDataFS, classRetrieveFile } from '../classFileSystem';

import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { AccessConfigService } from 'src/app/CloudServices/access-config.service';

import { fnAddTime, convertDate, strDateTime, fnCheckLockLimit, fnCheckTimeOut, defineMyDate, formatDateInSeconds, formatDateInMilliSeconds, findIds } from '../MyStdFunctions';
import { FillHealthAllInOut } from 'src/app/copyFilesFunction';
@Component({
  selector: 'app-file-access',
  templateUrl: './file-access.component.html',
  styleUrls: ['./file-access.component.css']
})
export class MainManageFileComponent {

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
  
  @Input() credentials = new classCredentials;
  @Input() credentialsMongo = new classCredentials;
  @Input() credentialsFS = new classCredentials;

  @Input() iWaitToRetrieve:Array<classRetrieveFile>=[];
  @Input() eventCheckToLimit=new classtheEvent;
  @Input() tabLock: Array<classAccessFile> = []; //0=unlocked; 1=locked by user; 2=locked by other user; 3=must be checked;
  @Input() triggerCheckToLimit:number=0;
  @Input() triggerReadFile:number=0;
  @Input() triggerSaveFile:number=0;
  @Input() triggerFileSystem:number=0;
  @Input() triggerFunction: number = 0;

  @Input() secondaryLevelFn:boolean=false;

  @Output() returnFile = new EventEmitter<any>();
  @Output() returnSaveFn = new EventEmitter<any>();
  @Output() resultFileSystem = new EventEmitter<any>();

  returnGetRecord={
    iWait:0,
    content:"",
    status:0,
    err:""
  }

  returnDataFS=new classHeaderReturnDataFS;

  actionParamChart:number=0;
  actionCalFat:number=0;
  actionRecipe:number=0;
  actionHealth:number=0;

  processDestroy: boolean = false;
  passDestroy: number=0;

  counterActions:number=0;
  returnActionFile:number=0;

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

  Error_Access_Server: string = '';


  EventHTTPReceived: Array<boolean> = [];
  EventStopWaitHTTP: Array<boolean> = [];
  maxEventHTTPrequest: number = 12;
  id_Animation: Array<number> = [];
  TabLoop: Array<number> = [];
  NbWaitHTTP: number = 0;

  isMustSaveFile:boolean=false;
  
  callFileSystem:boolean=true;
  nbCallFileSystem:number=0;

  
  theEvent = new classtheEvent;

  saveEvent: any;

  eventLockLimit={
    iWait:0,
    isDataModified:false,
    isSaveFile:false,
    lastInputAt:"",
  }

  iWait:number=0;


  ngOnInit(): void {
    console.log('file-access - ngOnInit');
    // used to open files in parallel using the google and mongo servers
    if (this.secondaryLevelFn===false){
      for (var i=0; i<this.maxEventHTTPrequest; i++){
        this.EventHTTPReceived[i] = false;
        this.EventStopWaitHTTP[i] = false;
        this.TabLoop[i]=0;
      }
    } else {
      this.nbCallFileSystem=2;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('file-access - ngOnChanges');
    var callSaveProcess=0;
    var isChecked=false;
    for (const propName in changes) {
      if ((propName === 'eventCheckToLimit' || propName === 'triggerCheckToLimit') &&  isChecked===false && this.eventCheckToLimit.checkLock.action!=="firstLoop") {  
        if (this.eventCheckToLimit.checkLock.iCheck===true){
          isChecked=true;
          this.nbRecallFS=0;
          console.log('ngOnChanges file-access eventCheckToLimit iWait=' + this.eventCheckToLimit.iWait);
          callSaveProcess++
          this.checkLockLimit(this.eventCheckToLimit);
        }
      } else if (propName === 'triggerReadFile' ) {
       
        for (var i=0; i< this.iWaitToRetrieve.length; i++){
          console.log('ngOnChanges file-access iWait=' + this.iWaitToRetrieve[i].iWait);
          this.retrieveRecord(this.iWaitToRetrieve[i].iWait)
        }
        if (this.iWaitToRetrieve.length>0){
          this.nbCallFileSystem++
        }
      } else if (propName === 'triggerFileSystem' ) {
        if (this.iWaitToRetrieve.length>0){
          this.nbCallFileSystem++
        }
      } else if ((propName === 'eventSaveRecord' || propName==='triggerSaveFile' || propName==='theTriggerSaveFile') && changes[propName].firstChange === false) {
          if (callSaveProcess===0){
            console.log('ngOnChanges file-access eventSaveRecord iWait=' + this.eventCheckToLimit.iWait);
            this.mainSaveProcess(this.eventCheckToLimit);
            callSaveProcess++
          }
      }
    }
  }
  nbRecallFS:number=0;
  resultFileSystemFn(event:any){
    console.log(' fileAccess process resultFS after emit from onFileSystem iWait=' + event.iWait +  '   returnDataFS=' + this.returnDataFS.iWait );
    if (this.returnDataFS.errorCode===666){
      console.log('this.returnDataFS.errorCode===666 this.nbRecallFS='+this.nbRecallFS );
      if (this.nbRecallFS<4){
        this.nbRecallFS++
        this.nbCallFileSystem++;
      } else {
        this.nbRecallFS=0;
      }
    } else {
      this.returnDataFS = event;
      console.log(' fileAccess end process resultFS; emit returnDataFS to calling apps (mainHealth) event.checkLock.iWait=' + event.iWait +  '   returnDataFS=' + this.returnDataFS.iWait);
      this.resultFileSystem.emit(this.returnDataFS);
    }
  }

  unlockFile(iWait:number){
    this.tabLock[iWait].action="unlock";
    this.callFileSystem=true;
    this.nbCallFileSystem++;
  }
  
  errCalcCalFat:string="";
  checkLockLimit(event:any) {
    console.log('file-access - start checkLockLimit - this.nbCallFileSystem='+this.nbCallFileSystem+'  this.returnDataFS.nbRecall='+this.returnDataFS.nbRecall);
    var valueCheck = { action: '', lockValue: 0, lockAction: '' };
    var eventToCheck=new classtheEvent;
    eventToCheck=this.eventCheckToLimit;
    this.errCalcCalFat="";
    if (this.identification.triggerFileSystem === "No") { //"No"
      valueCheck.action = "noAction";
    } else {
      valueCheck = fnCheckLockLimit(this.configServer, this.tabLock, event.checkLock.iWait, event.checkLock.lastInputAt, event.checkLock.isDataModified, event.checkLock.isSaveFile);
    }
    if (valueCheck.action !== 'noAction') {
      if (valueCheck.action === 'changeTabLock') {
        this.tabLock[event.checkLock.iWait].lock = valueCheck.lockValue;
      } else if (valueCheck.action === 'ProcessSave') {
        this.mainSaveProcess(this.eventCheckToLimit);
        /*
        this.returnDataFS.iWait=event.checkLock.iWait;
        this.returnDataFS.processSave=true;
        this.resultFileSystem.emit(this.returnDataFS);
        */
        // this.nbCallFileSystem++;
      } else {
        this.iWaitToRetrieve.splice(0,this.iWaitToRetrieve.length);
        const theClass=new classRetrieveFile;
        this.iWaitToRetrieve.push(theClass);
        this.iWaitToRetrieve[0].iWait=event.checkLock.iWait;
        this.iWaitToRetrieve[0].accessFS=true;
        this.callFileSystem=true; 
        this.nbCallFileSystem++;
        if (valueCheck.action === 'updateSystemFile') {
          this.tabLock[event.checkLock.iWait].action = valueCheck.lockAction;
        } else if (valueCheck.action === 'checkFile') {
          if (event.isSaveFile === false) {
            this.tabLock[event.checkLock.iWait].action = 'check&update';
          } else {
            this.tabLock[event.checkLock.iWait].action = 'check';
          }
        } 
      }
    } else {
      this.counterActions++
      this.returnActionFile=this.counterActions;
      this.returnDataFS.nbRecall++
      this.returnDataFS.iWait=event.checkLock.iWait;
      this.returnDataFS.errorCode=0;
      this.returnDataFS.errorMsg="";
      this.returnDataFS.checkToLimit=0; // no action needed; process should continue
      this.resultFileSystem.emit(this.returnDataFS);
    }

    console.log('file-access - end checkLockLimit - this.nbCallFileSystem='+this.nbCallFileSystem+'  this.returnDataFS.nbRecall='+this.returnDataFS.nbRecall);
  }
  
  retrieveRecord(event:any){
    if (event===0){
      this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.fileHealth, 0);
    } else if (event===1){
      this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.calories, 1);
    } else if (event===2){
      this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.convertUnit, 2);
    } else if (event===3){
      this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.confHTML, 3);
    } else if (event===4){
      this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.confChart, 4); // individual
    } else if (event===5){
      this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.myChartConfig, 5);
    } else if (event===6){
      this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.recipe, 6);
    } else if (event===7){

    } else if (event===8){

    } else if (event===7){
    
    } else if (event===10){
      this.getRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.convToDisplay,10);
    }
    this.iWait=event;
    this.tabLock[this.iWait].action='check&update';
    //this.nbCallFileSystem++
    //this.callFileSystem=true; 
  }

  getRecord(Bucket: string, GoogleObject: string, iWait: number) {
    console.log('getRecord - iWait='+iWait);
    this.EventHTTPReceived[iWait] = false;
    this.EventStopWaitHTTP[iWait]=false;
    this.NbWaitHTTP++;

    this.waitHTTP(this.TabLoop[iWait], 3000, iWait);
    this.ManageGoogleService.getContentObject(this.configServer, Bucket, GoogleObject)
      .subscribe((data) => {
            console.log('getRecord - data received for iWait='+iWait);
          this.EventStopWaitHTTP[iWait]=true;
          this.returnGetRecord.iWait = iWait;
          var noPb=true;
          if (data.status!==undefined && data.status!==200){
            
            this.returnGetRecord.content = "";
            this.returnGetRecord.status = data.status;
            this.returnGetRecord.err=data.msg;
            noPb=false;
          } else {
            this.returnGetRecord.content = data;
            this.returnGetRecord.status = 0;
          }
          this.returnFile.emit(this.returnGetRecord);
        },
        err => {
          this.EventStopWaitHTTP[iWait]=true;
          this.returnGetRecord.iWait = iWait;
          this.returnGetRecord.content = "";
          this.returnGetRecord.status = 700;
          this.returnGetRecord.err=err;
          console.log('get record ' + " error="+JSON.stringify(err));
          this.returnFile.emit(this.returnGetRecord);
        }
      )
  }


/*
  confirmSaveAction:boolean=false;

  confirmSave(event: any) {
    if (this.tabLock[event.checkLock.iWait].lock === 1) {
      this.confirmSaveAction = true;
      //this.checkLockLimit({iWait:event.checkLock.iWait,isDataModified:event.checkLock.isDataModified,isSaveFile:event.checkLock.isSaveFile, lastInputAt:event.checkLock.lastInputAt});
      this.checkLockLimit(event);
      this.confirmSaveAction = false;
    } 
  }
*/



  mainSaveProcess(event:any){
    this.SaveNewRecord(event.bucket, event.object, event.fileContent, event.iWait);
  }

  SaveNewRecord(GoogleBucket: string, GoogleObject: string, record: any, iWait: number) {
    //var file=new File ([JSON.stringify(this.HealthAllData)],GoogleObject, {type: 'application/json'});
    var file = new File([JSON.stringify(record)], GoogleObject, { type: 'application/json' });
    const iWaitSave=iWait;
    if (GoogleObject === 'ConsoleLog.json') {
      const myTime = new Date();
      GoogleObject = 'ConsoleLog.json-' + myTime.toString().substring(4, 21);
      file = new File([JSON.stringify(this.myConsole)], GoogleObject, { type: 'application/json' });
    }
    if (this.identification.triggerFileSystem !== "No") {
      this.tabLock[iWait].action='updatedAt';
      this.callFileSystem=true;
      this.nbCallFileSystem++;
    }
    console.log('SaveNewRecord of object=' + GoogleObject);

    this.ManageGoogleService.uploadObject(this.configServer, GoogleBucket, file, GoogleObject)
      .subscribe(res => {
        console.log('Return of SaveNewRecord of object=' + GoogleObject + '  res.type='+res.type);
        if (res.type === 4 ) {
          console.log('Successful SaveNewRecord of object=' + GoogleObject);
          this.counterActions++
          this.returnActionFile=this.counterActions;
          this.tabLock[iWait].status = 0;
          this.returnGetRecord.status=200;
          this.returnGetRecord.iWait=iWaitSave;
          this.returnSaveFn.emit(this.returnGetRecord);
          //this.errorMsg = 'File "' + GoogleObject + '" is successfully stored in the cloud';
        }
      },
        error_handler => {
          //**this.LogMsgConsole('Individual Record is not updated: '+ this.Table_User_Data[this.identification.id].UserId );
          this.counterActions++
          //this.errorMsg = 'File' + GoogleObject + '" *** Save action failed - status is ' + error_handler.status;
          this.returnActionFile=-this.counterActions;
          this.returnGetRecord.status=700;
          this.returnGetRecord.iWait=iWait;
          this.returnGetRecord.err= 'File' + GoogleObject + '" *** Save action failed - status is ' + error_handler.status;
          this.returnSaveFn.emit(this.returnGetRecord);
        }
      )
  }
/*
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
*/
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

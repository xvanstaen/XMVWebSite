
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
  
  import { BucketList, Bucket_List_Info } from './JsonServerClass';
  
  // configServer is needed to use ManageGoogleService
  // it is stored in MongoDB and accessed via ManageMongoDBService
  
  import { msginLogConsole } from './consoleLog'
  import { configServer, LoginIdentif, msgConsole, classCredentials, classtheEvent } from './JsonServerClass';
  import { classPosDiv, getPosDiv } from './getPosDiv';
  
  import { getStyleDropDownContent, getStyleDropDownBox, classDropDown } from './DropDownStyle'
  
  import { ClassSubConv, ClassConv, mainClassConv, mainConvItem, ClassUnit, ConvItem } from './ClassConverter'
  
  import { ClassCaloriesFat, mainClassCaloriesFat } from './Health/ClassHealthCalories'
  import { ClassItem, DailyReport, mainDailyReport, ClassMeal, ClassDish } from './Health/ClassHealthCalories'
  
  import { classConfHTMLFitHealth, classConfTableAll } from './Health/classConfHTMLTableAll';
  
  import { CalcFatCalories } from './Health/CalcFatCalories';
  import { classConfigChart, classchartHealth } from './Health/classConfigChart';
  import { classAxis, classLegendChart, classPluginTitle, classTabFormChart, classFileParamChart } from './Health/classChart';
  import { classFileSystem, classAccessFile, classReturnDataFS } from './classFileSystem';
  
  import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';
  import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
  import { AccessConfigService } from 'src/app/CloudServices/access-config.service';
  
  import { fnAddTime, convertDate, strDateTime, fnCheckLockLimit, fnCheckTimeOut, defineMyDate, formatDateInSeconds, formatDateInMilliSeconds, findIds } from './MyStdFunctions';
  import { FillHealthAllInOut } from 'src/app/copyFilesFunction';
  @Component({
    selector: 'app-main-manage-file',
    templateUrl: './main-manage-file.component.html',
    styleUrls: ['./main-manage-file.component.css']
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
  
    @Output() returnFile = new EventEmitter<any>();
    @Output() resetServer = new EventEmitter<any>();
    @Output() newCredentials = new EventEmitter<any>();
  
    @Input() configServer = new configServer;
    @Input() identification = new LoginIdentif;
    @Input() triggerFunction: number = 0;
    
    @Input() credentials = new classCredentials;
    @Input() credentialsMongo = new classCredentials;
    @Input() credentialsFS = new classCredentials;

    @Input() iWaitToRetrieve:Array<number>=[];
  
    retrievedFile:any;

    actionParamChart:number=0;
    actionCalFat:number=0;
    actionRecipe:number=0;
    actionHealth:number=0;

    processDestroy: boolean = false;
    passDestroy: number=0;
  
    counterActions:number=0;
    
    returnDataFSHealth=new classReturnDataFS;
    returnDataFSCalFat=new classReturnDataFS;
    returnDataFSParamChart=new classReturnDataFS;
    returnDataFSRecipe=new classReturnDataFS;
  
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
    
    IsSaveConfirmedAll:boolean=false;
    isSaveHealth:boolean=false;
  
    isMustSaveFile:boolean=false;
    
    callFileSystem:boolean=false;
    nbCallFileSystem:number=0;
  
    
    theEvent = new classtheEvent;
  
    saveEvent: any;
  
    eventLockLimit={
      iWait:0,
      isDataModified:false,
      isSaveFile:false,
      lastInputAt:"",
    }
  

    resultFileSystemHealth:number=0;
    resultFileSystemCalFath:number=0;
    resultFileSystemParamChart:number=0;
    resultFileSystemRecipe:number=0;
    iWait:number=0;
  
  
    ngOnInit(): void {
      // used to open files in parallel using the google and mongo servers
            this.saveServer.google=this.configServer.googleServer;
        this.saveServer.mongo=this.configServer.mongoServer;
        this.saveServer.FS=this.configServer.fileSystemServer;
    
        for (var i = 0; i <15; i++) {
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

        for (var i=0; i< this.iWaitToRetrieve.length; i++){
            this.retrieveRecord(this.iWaitToRetrieve[i])
        }
    }
  
    resultFileSystem(event:any){
      this.callFileSystem=false;
      this.errorMsg="";
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
  
    unlockFile(iWait:number){
      this.tabLock[iWait].action="unlock";
      this.callFileSystem=true;
      this.nbCallFileSystem++;
    }
    
    
    errCalcCalFat:string="";
    checkLockLimit(event:any) {
      const iWait=event.iWait;
      const isDataModified=event.isDataModified; 
      const isSaveFile=event.isSaveFile;
      const lastInputAt=event.lastInputAt;


      var valueCheck = { action: '', lockValue: 0, lockAction: '' };
      this.errorMsg="";
      this.errCalcCalFat="";
      if (this.identification.triggerFileSystem === "No") { //"No"
        valueCheck.action = "noAction";
      } else {
        valueCheck = fnCheckLockLimit(this.configServer, this.tabLock, iWait, lastInputAt, isDataModified, isSaveFile);
      }
      if (valueCheck.action !== 'noAction') {
        if (valueCheck.action === 'updateSystemFile') {
          this.tabLock[iWait].action = valueCheck.lockAction;
          //this.onFileSystem(iWait);
          this.callFileSystem=true; 
          this.nbCallFileSystem++;
        } else if (valueCheck.action === 'checkFile') {
          if (event.isSaveFile === false) {
            //this.checkUpdateFile(iWait)
            this.tabLock[iWait].action = 'check&update';
            this.callFileSystem=true; 
            this.nbCallFileSystem++;
          } else {
            //this.checkFile(iWait);
            this.tabLock[iWait].action = 'check';
            this.callFileSystem=true; 
            this.nbCallFileSystem++;
          }
        } else if (valueCheck.action === 'changeTabLock') {
          this.tabLock[iWait].lock = valueCheck.lockValue;
        } else if (iWait === 0 && valueCheck.action === 'ProcessSave') {
          this.processSaveHealth(this.theEvent);
        } else if (iWait === 5 && valueCheck.action === 'ProcessSave') {
          this.processSaveParamChart();
        } else if (iWait === 1 && valueCheck.action === 'ProcessSave') {
          this.processSaveCaloriesFat(this.theEvent);
        }
      } else {
        this.counterActions++
        if (iWait === 0){
          this.actionHealth=this.counterActions;
        } else if (iWait === 1){
          this.actionCalFat=this.counterActions;
        } else if (iWait === 5){
          this.actionParamChart=this.counterActions;
        } 
      }
    }
    

  
    retrieveRecord(event:any){
      if (event===0){
        this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.fileHealth, 0);
      } else if (event===1){
        this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.calories, 1);
    } else if (event===4){
        this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.confChart, 4)
      } else if (event===5){
        this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.myChartConfig, 5);
      } else if (event===6){
        this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.recipe, 6);
      } else if (event===10){
        this.getRecord(this.identification.configFitness.bucket,this.identification.configFitness.files.convToDisplay,10);
      }
      this.iWait=event;
      this.tabLock[this.iWait].action='check&update';
      this.callFileSystem=true; 
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
          } else {
            if (iWait===0 || iWait===4){
                this.saveServer.FS = this.configServer.googleServer;
            }
            this.retrievedFile = data;
          }
          },
          err => {
            this.EventStopWaitHTTP[iWait]=true;
            
            console.log('get record '+this.errorMsg + " error="+JSON.stringify(err));
          }
        )
    }
  

  
    getChartFiles() {
        this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.confChart, 4); // individual
        this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.myChartConfig, 5); // default
    }
  
    reAccessHealthFile() {
        /*
      console.log('reAccessHealthFile');
      this.HealthAllData.tabDailyReport.splice(0, this.HealthAllData.tabDailyReport.length);
      this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.fileHealth, 0);
      */
    }
  
    reAccessChartFile() {
        /*
      this.fileParamChart.data.splice(this.fileParamChart.data.length);
      this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.myChartConfig, 5);
      */
    }
  
    reAccessConfigCal() {
        /*
      this.ConfigCaloriesFat.tabCaloriesFat.splice(this.ConfigCaloriesFat.tabCaloriesFat.length);
      this.getRecord(this.identification.configFitness.bucket, this.identification.configFitness.files.calories, 1);
      */
    }
  
    reAccessRecipe(){
        /*
      this.fileRecipe.tabCaloriesFat.splice(0,this.fileRecipe.tabCaloriesFat.length);
      this.getRecord(this.identification.fitness.bucket, this.identification.fitness.files.recipe, 6);
      */
    }
  
    processSaveParamChart() {
        /*
      this.errorMsg="";
      this.fileParamChart.fileType = this.identification.fitness.fileType.myChart;
      this.fileParamChart.updatedAt = strDateTime();
      this.SaveNewRecord(this.identification.fitness.bucket, this.identification.fitness.files.myChartConfig, this.fileParamChart, 5);
      */
    }
  
  
    SaveCaloriesFat(event: any) {
        /*
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
      */
    }
  
    processSaveCaloriesFat(event: any) {
        /*
        if (this.ConfigCaloriesFat.fileType === '') {
          this.ConfigCaloriesFat.fileType = this.identification.configFitness.fileType.calories;
        }
        this.ConfigCaloriesFat.updatedAt = strDateTime();
        this.SaveNewRecord(this.identification.configFitness.bucket, event.fileName, this.ConfigCaloriesFat, 1);
        */
    }
  
    SaveRecipeFile(event: any) {
        /*
        if (this.fileRecipe.fileType === '') {
          this.fileRecipe.fileType = this.identification.fitness.fileType.recipe;
        }
        this.fileRecipe.updatedAt = strDateTime();
        this.SaveNewRecord(this.identification.fitness.bucket, event.fileName, this.fileRecipe, 6);
        */
    }
  
    confirmSaveAction:boolean=false;
  
    confirmSave(event: any) {
      if (this.tabLock[event.checkLock.iWait].lock === 1) {
        this.confirmSaveAction = true;
        this.checkLockLimit({iWait:event.checkLock.iWait,isDataModified:event.checkLock.isDataModified,isSaveFile:event.checkLock.isSaveFile, lastInputAt:event.checkLock.lastInputAt});
        this.confirmSaveAction = false;
      } 
    }
  
    saveCopy() {
        /*
        this.HealthAllData.tabDailyReport.sort((a, b) => (a.date > b.date) ? -1 : 1);
        if (this.HealthAllData.fileType !== '') {
          this.HealthAllData.fileType = this.identification.fitness.fileType.Health;
        }
        this.HealthAllData.updatedAt = strDateTime();
        this.SaveNewRecord(this.identification.fitness.bucket, this.SpecificForm.controls["FileName"].value, this.HealthAllData, 0);
        this.cancelCopy();
        */
    }
  
    cancelCopy() {
        /*
      this.errorMsg="";
      this.isCopyFile = false;
      this.TheSelectDisplays.controls['CopyFile'].setValue('N');
      */
    }
  
    cancelUpdates(iWait:number){
        /*
      this.errorMsg="";
      if (iWait === 0) {
        this.HealthAllData.tabDailyReport.splice(0, this.HealthAllData.tabDailyReport.length)
        this.HealthAllData = FillHealthAllInOut(this.HealthAllData, this.InHealthAllData);
        this.initTrackRecord();
        this.IsSaveConfirmedAll = false;
      } 
      this.counterActions++;
      this.actionHealth++;
      */
    }
  
    processSave(event: any) {
      this.errorMsg="";
      this.confirmSaveAction = true;
      this.theEvent=event;
      this.checkLockLimit({iWait:event.checkLock.iWait,isDataModified:event.checkLock.isDataModified,isSaveFile:event.checkLock.isSaveFile, lastInputAt:event.checkLock.lastInputAt});
      this.confirmSaveAction = false;
      this.iWait=event.checkLock.iWait;
      if (this.callFileSystem===true){
        this.nbCallFileSystem++;
      }
    }
  
    processSaveHealth(event: any) {
        /*
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
      this.HealthAllData.updatedAt = strDateTime();
      this.SaveNewRecord(this.identification.fitness.bucket, event.fileName, this.HealthAllData, 0);
      this.InHealthAllData.tabDailyReport.splice(0,this.InHealthAllData.tabDailyReport.length);
      this.InHealthAllData = FillHealthAllInOut(this.InHealthAllData,  this.HealthAllData);
      this.initTrackRecord();
      */
    }
  
    SaveNewRecord(GoogleBucket: string, GoogleObject: string, record: any, iWait: number) {
      this.errorMsg="";
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
        this.nbCallFileSystem++;
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
import {
  Component, OnInit, Input, Output, HostListener, OnDestroy, HostBinding, ChangeDetectionStrategy,
  SimpleChanges, EventEmitter, AfterViewInit, AfterViewChecked, AfterContentChecked, Inject, LOCALE_ID
} from '@angular/core';

// angular-google-auth2
//import {AuthService} from 'angular-google-auth2';

import { Buffer } from 'buffer';

import { DatePipe, formatDate } from '@angular/common';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { ViewportScroller } from "@angular/common";
import { FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { Observable } from 'rxjs';

import { BucketList, Bucket_List_Info, OneBucketInfo, classCredentials, classTabMetaPerso } from '../JsonServerClass';

import { msginLogConsole } from '../consoleLog';
import { configServer, classFilesToCache,  UserParam, LoginIdentif, msgConsole } from '../JsonServerClass';

import { classAccessFile, classFileSystem } from '../classFileSystem';
import { ManageSecuredGoogleService } from 'src/app/CloudServices/ManageSecuredGoogle.service';
import { ManageMongoDBService } from 'src/app/CloudServices/ManageMongoDB.service';
import { ManageGoogleService } from 'src/app/CloudServices/ManageGoogle.service';
import { TutorialService } from 'src/app/CloudServices/tutorial.service';
import { fillConfig } from '../copyFilesFunction';
import { convertLongFormatDate } from '../MyStdFunctions';


export class classtimeOutRecord{
  status:number=956;
  updatedAt:string="";
  timeOut:string="";
  currentTime:string="";
}


@Component({
  selector: 'app-cache-console',
  templateUrl: './cache-console.component.html',
  styleUrls: ['./cache-console.component.css']
})
export class CacheConsoleComponent {

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private scroller: ViewportScroller,
    private ManageSecuredGoogleService: ManageSecuredGoogleService,
    private ManageMongoDBService: ManageMongoDBService,
    private ManageGoogleService: ManageGoogleService,
    private ManageTutorialService: TutorialService,
    //public auth: AuthService,

    @Inject(LOCALE_ID) private locale: string,
  ) { }

  @Input() configServer = new configServer;

  @Input() initData={
              getRecord:false,
              record:[],
              app:"",
              nbCalls:0
              };
  @Input() reTriggerFn:number=0;            

  @Output() returnError = new EventEmitter<any>();

  event={
    error:"",
    app:"",
    status:0,
  }

  memoryCacheConsole:Array<any>=[];

  EventStopWaitHTTP: Array<boolean> = [];
  EventHTTPReceived: Array<boolean> = [];

  id_Animation: Array<number> = [];
  TabLoop: Array<number> = [];
  maxLoop: number = 4000;


  tabLock:Array<classAccessFile>=[]; 
  fileSystem:Array<classFileSystem>=[];
  iWait:string="";

  error:string="";
  errorAccessFile:string="";

  timeOutRecord= new classtimeOutRecord;

  ngOnInit(){
    this.event.app=this.initData.app;
    if (this.initData.getRecord===true){
      this.EventStopWaitHTTP[0]=false;
      this.EventHTTPReceived[0]=false;
      this.TabLoop[0] = 0;
      this.waitHTTP(this.TabLoop[0], this.maxLoop, 0)
      this.getCacheConsole();
      
    } else if (this.initData.record.length>0){
      this.manageRecord(this.initData.record);
      this.EventHTTPReceived[0]=true;
    } else {
      this.error = "no correct data provided"
    }
  }

  manageRecord(data:any){

    for (var i=0; i<data.msg.length; i++){
      const theClass={theDate:"",module:"",msg:"",server:"",content:"",credentials:new classCredentials,tabLock:new classAccessFile,otherUser:new classtimeOutRecord, FS:new classFileSystem,recordTO:""};
      this.memoryCacheConsole.push(theClass);
      this.memoryCacheConsole[i].theDate=data.msg[i].theDate;
      this.memoryCacheConsole[i].msg=data.msg[i].msg;
      this.memoryCacheConsole[i].module=data.msg[i].module;
      if (data.msg[i].server!==undefined){
        this.memoryCacheConsole[i].server=data.msg[i].server;
      }
      if (data.msg[i].content!==undefined){
        if (data.msg[i].content.credentials!==undefined){
          this.memoryCacheConsole[i].credentials.userServerId=data.msg[i].content.credentials.userServerId;
          this.memoryCacheConsole[i].credentials.creationDate= convertLongFormatDate(data.msg[i].content.credentials.creationDate);
          this.memoryCacheConsole[i].credentials.server=data.msg[i].content.credentials.server;
        } else {this.memoryCacheConsole[i].credentials.creationDate=""}
        if (data.msg[i].content.tabLock!==undefined){
          if (data.msg[i].content.tabLock.updatedAt!==""){
            this.memoryCacheConsole[i].tabLock.updatedAt = convertLongFormatDate(data.msg[i].content.tabLock.updatedAt);
          }
          if (data.msg[i].content.tabLock.createdAt!==""){
            this.memoryCacheConsole[i].tabLock.createdAt = convertLongFormatDate(data.msg[i].content.tabLock.createdAt);
          }
          this.memoryCacheConsole[i].tabLock.credentialDate = convertLongFormatDate(data.msg[i].content.tabLock.credentialDate);
          this.memoryCacheConsole[i].tabLock.userServerId = data.msg[i].content.tabLock.userServerId;
          this.memoryCacheConsole[i].tabLock.user = data.msg[i].content.tabLock.user;
        }  else {this.memoryCacheConsole[i].tabLock.byUser=""}
        if (data.msg[i].content.updatedAt!==undefined){
            this.memoryCacheConsole[i].otherUser.updatedAt=convertLongFormatDate(data.msg[i].content.updatedAt);
            this.memoryCacheConsole[i].otherUser.currentTime=convertLongFormatDate(data.msg[i].content.currentTime);
            this.memoryCacheConsole[i].otherUser.status = data.msg[i].content.status;
            this.memoryCacheConsole[i].otherUser.timeOut =convertLongFormatDate(data.msg[i].content.timeOut);
        } else {this.memoryCacheConsole[i].otherUser.updatedAt=""}
        if (data.msg[i].content.fileSystem!==undefined ){
          if (data.msg[i].content.fileSystem.length===0){
            this.memoryCacheConsole[i].msg=this.memoryCacheConsole[i].msg + "  File system is empty";
            this.memoryCacheConsole[i].FS.updatedAt="";
          }
          for (var j=0; j<data.msg[i].content.fileSystem.length; j++){
            this.memoryCacheConsole[i].FS.createdAt=convertLongFormatDate(data.msg[i].content.fileSystem[j].createdAt);
            this.memoryCacheConsole[i].FS.updatedAt=convertLongFormatDate(data.msg[i].content.fileSystem[j].updatedAt);
            this.memoryCacheConsole[i].FS.credentialDate=convertLongFormatDate(data.msg[i].content.fileSystem[j].credentialDate);
            this.memoryCacheConsole[i].FS.byUser=data.msg[i].content.fileSystem[j].byUser;
            this.memoryCacheConsole[i].FS.object=data.msg[i].content.fileSystem[j].object;
            this.memoryCacheConsole[i].FS.userServerId=data.msg[i].content.fileSystem[j].userServerId;
          }
          
        }
        if (data.msg[i].content.code!==undefined){
          this.memoryCacheConsole[i].content="code = " + data.msg[i].content.code;
        }
      } else {
            this.memoryCacheConsole[i].content="";
      }
    }
  }


  getCacheConsole() {
    this.memoryCacheConsole.splice(0,this.memoryCacheConsole.length);
    this.ManageSecuredGoogleService.getCacheConsole(this.configServer)
      .subscribe(
        (data) => {
          this.EventStopWaitHTTP[0]=true;
          if (Array.isArray(data.msg)=== true){
            this.manageRecord(data);
            this.EventHTTPReceived[0] = true;
          } else {
            this.event.error=data.msg;
            this.event.status=220;
            this.returnError.emit(this.event);
            
          }
        },
        err => {
          this.EventStopWaitHTTP[0]=true;
          this.event.error=err;
          this.event.status=700;
          this.returnError.emit(this.event);
          this.error = JSON.stringify(err);
        });
  }

  waitHTTP(loop: number, max_loop: number, eventNb: number) {
    const pas = 500;
    if (loop % pas === 0) {
      console.log('waitHTTP ==> loop=' + loop + ' max_loop=' + max_loop + '  eventNb=' + eventNb);
    }
    loop++

    this.id_Animation[eventNb] = window.requestAnimationFrame(() => this.waitHTTP(loop, max_loop, eventNb));
    if (loop > max_loop || this.EventHTTPReceived[eventNb] === true || this.EventStopWaitHTTP[eventNb] === true) {
      console.log('exit waitHTTP ==> loop=' + loop + ' max_loop=' + max_loop + ' this.EventHTTPReceived=' +
        this.EventHTTPReceived[eventNb]);
      if (loop > max_loop ){
        this.errorAccessFile="server problem; timeout reached";
        this.event.error=this.errorAccessFile;
        this.event.status=700;
        this.returnError.emit(this.event);
      };
      window.cancelAnimationFrame(this.id_Animation[eventNb]);
 
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const j = changes[propName];
      
        if (propName === 'reTriggerFn' && changes['reTriggerFn'].firstChange === false) {

          console.log('firstChange === false');
          this.ngOnInit();

        } else if (propName === 'reTriggerFn' && changes['reTriggerFn'].firstChange === true) {
          console.log('firstChange === true');
        } 
      
    }
  }
}
